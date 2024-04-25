import users from "../config/mongoCollections.js";
import {ObjectId} from "mongodb";
import bcrypt from "bcrypt";
import validation from "../validation.js";
// import redis from "redis";
import AWS from 'aws-sdk';
import fs from 'fs';

/**
 * @param {ObjectId} _id - A globally unique identifier to represent the user.
 * @param {string} firstName - First name of the user.
 * @param {string} lastName - Last name of the user.
 * @param {string} email - email of the user.
 * @param {[string,string]} languages - languages of the user he/she can speak.
 * @param {string} gender - gender of the user.
 * @param {string} dob - birthday of the user.
 * @param {string} phoneNumber - phoneNumber of the user.
 * @param {string} password - The password when users log in.
 * @param {string} userSince - the user's registration time.
 * @param {String} profilePictureLocation - The URL points to the item in S3
 * @param {HashTable{{user_id, “status”},{...},...}} friends - A HashTable that has friend_id as the key and the status as value.
 * @param {String} role - A String variable reflects whether the user is an admin or user.
 */


// const client = redis.createClient();
// client.connect().then(() => {
// });

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_ID = process.env.AWS_ACCESS_KEY_ID;
const bucketName = process.env.bucketName;

AWS.config.update({
    region: 'us-east-1',
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_ID
});


const createURLByPath = async (filePath) => {
    const s3 = new AWS.S3();
    const fileContent = fs.readFileSync(filePath);
    const randomString = Math.random().toString(36).substring(2, 15)
        + Math.random().toString(36).substring(2, 15);
    const originalFileName = filePath.split('/').pop();

    const currentFileName = randomString + '.' + originalFileName.slice(((originalFileName.lastIndexOf(".") - 1) >>> 0) + 2);
    const params = {
        Bucket: bucketName,
        Key: currentFileName,
        Body: fileContent
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                reject(err);
            } else {
                console.log("Successfully uploaded file to S3");
                const url = `https://${bucketName}.s3.amazonaws.com/usersProfileFolder/${currentFileName}`;
                console.log("File URL:", url);
                resolve(url);
            }
        });
    });
};

const createURLByFile = async (file) => {
    const s3 = new AWS.S3();
    const randomString = Math.random().toString(36).substring(2, 15)
        + Math.random().toString(36).substring(2, 15);

    const filenameParts = file.originalname.split('.');
    const extension = filenameParts[filenameParts.length - 1];

    const currentFileName = randomString + '.' + extension;

    const fileContent = file.buffer;
    const params = {
        Bucket: bucketName,
        Key: currentFileName,
        Body: fileContent
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                reject(err);
            } else {
                console.log("Successfully uploaded file to S3");
                const url = `https://${bucketName}.s3.amazonaws.com/usersProfileFolder/${currentFileName}`;
                console.log("File URL:", url);
                resolve(url);
            }
        });
    });
};

export const createUser = async (
    firstName,
    lastName,
    email,
    languages,
    gender,
    dob,
    phoneNumber,
    password,
    profilePictureLocation
) => {
    firstName = validation.validateName(firstName, "firstName");
    lastName = validation.validateName(lastName, "lastName");
    email = validation.validateEmail(email);
    phoneNumber = validation.validatePhoneNumber(phoneNumber);
    password = validation.validatePassword(password, "password");
    languages = validation.validateLanguages(languages);
    gender = validation.validateGender(gender);
    dob = validation.validateDateTime(dob);

    const userCollection = await users();
    const ifExist = await userCollection.findOne({email: email});
    if (ifExist) {
        throw `Error: ${email} is already registered, Please Login`;
    }

    // if (!profilePictureLocation) {
    //     profilePictureLocation = "https://veilchat-s3.s3.amazonaws.com/usersProfileFolder/defaultUserProfilePicture.jpg";
    // } else if (typeof profilePictureLocation === 'string') {
    //     profilePictureLocation = await createURLByPath(profilePictureLocation);
    // } else {
    //     profilePictureLocation = await createURLByFile(profilePictureLocation);
    // }

    const user = {
        firstName,
        lastName,
        email,
        languages,
        gender,
        dob,
        phoneNumber,
        password: await bcrypt.hash(password, 15),
        userSince: validation.generateCurrentDate(),
        profilePictureLocation,
        friends: []
    };

    const insertUser = await userCollection.insertOne(user);
    if (!insertUser.acknowledged || !insertUser.insertedId) {
        throw `Error: couldn't register the account: ${email}`;
    }
    return {insertedUser: true};
};


export const loginUser = async (email, password, currentLocation) => {
    email = validation.validateEmail(email);
    password = validation.validatePassword(password);

    const userCollection = await users();
    const user = await userCollection.findOne({
        email: email
    });
    if (!user) {
        throw "Error: Either the email address or password is invalid";
    }
    const checkPassword = await bcrypt.compare(
        password,
        user.password
    );
    if (!checkPassword) {
        throw "Error: Either the email address or password is invalid"
    } else {
        return {
            userId: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            gender: user.gender,
            dob: user.dob,
            phoneNumber: user.phoneNumber,
            languages: user.languages,
            userSince: user.userSince,
            profilePictureLocation: user.profilePictureLocation,
            friends: user.friends
        };
    }
};

export const updateUserFirstName = async (
    userId,
    firstName
) => {
    firstName = validation.validateName(firstName, "firstName");
    userId = validation.checkId(userId, "userId");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});
    if (!user) {
        throw `Error: User with ID ${userId} not found`;
    }
    const updateUser = await userCollection.updateOne(
        {_id: new ObjectId(userId)},
        {$set: {firstName}}
    );
    if (updateUser.modifiedCount === 0) {
        throw `Error: Failed to update last name for user with ID ${userId}`;
    }
    return {updated: true};
}

export const updateUserLastName = async (userId, lastName) => {
    lastName = validation.validateName(lastName, "lastName");
    userId = validation.checkId(userId, "userId");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});
    if (!user) {
        throw `Error: User with ID ${userId} not found`;
    }
    const updateUser = await userCollection.updateOne(
        {_id: user._id},
        {$set: {lastName}}
    );
    if (updateUser.modifiedCount === 0) {
        throw `Error: Failed to update last name for user with ID ${userId}`;
    }
    return {updated: true};
};

export const updateUserPassword = async (userId, oldPassword, newPassword) => {
    userId = validation.checkId(userId, "userId");
    oldPassword = validation.validatePassword(oldPassword, "oldPassword");
    newPassword = validation.validatePassword(newPassword, "newPassword");

    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});

    if (!user) {
        throw `Error: User with ID ${userId} not found`;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw `Error: Old password is incorrect`;
    }

    if (await bcrypt.compare(newPassword, user.password)) {
        throw `Error: New password cannot be the same as the old password`;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 15);

    const updateUser = await userCollection.updateOne(
        {_id: user._id},
        {$set: {password: hashedNewPassword}}
    );

    if (updateUser.modifiedCount === 0) {
        throw `Error: Failed to update password for user with ID ${userId}`;
    }
    return {updated: true};
};


export const updateUserLanguages = async (userId, languages) => {
    languages = validation.validateLanguages(languages);
    userId = validation.checkId(userId, "userId");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});
    if (!user) {
        throw `Error: User with ID ${userId} not found`;
    }
    const updateUser = await userCollection.updateOne(
        {_id: user._id},
        {$set: {languages}}
    );
    if (updateUser.modifiedCount === 0) {
        throw `Error: Failed to update country for user with ID ${userId}`;
    }
    return {updated: true};
};

export const updateUserPhoneNumber = async (userId, phoneNumber) => {
    phoneNumber = validation.validatePhoneNumber(phoneNumber);
    userId = validation.checkId(userId, "userId");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});
    if (!user) {
        throw `Error: User with ID ${userId} not found`;
    }
    const updateUser = await userCollection.updateOne(
        {_id: user._id},
        {$set: {phoneNumber}}
    );
    if (updateUser.modifiedCount === 0) {
        throw `Error: Failed to update phone number for user with ID ${userId}`;
    }
    return {updated: true};
};

// Update user's profile picture location
export const updateUserProfilePictureLocation = async (userId, profilePictureLocation) => {
    userId = validation.checkId(userId, "userId");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});
    if (!user) {
        throw `Error: User with ID ${userId} not found`;
    }
    if (!profilePictureLocation) {
        profilePictureLocation = "https://veilchat-s3.s3.amazonaws.com/usersProfileFolder/defaultUserProfilePicture.jpg";
    } else if (typeof profilePictureLocation === 'string') {
        profilePictureLocation = await createURLByPath(profilePictureLocation);
    } else {
        profilePictureLocation = await createURLByFile(profilePictureLocation);
    }

    const updateUser = await userCollection.updateOne(
        {_id: user._id},
        {$set: {profilePictureLocation}}
    );
    if (updateUser.modifiedCount === 0) {
        throw `Error: Failed to update profile picture for user with ID ${userId}`;
    }
    return {updated: true};
};

export const updateFriendStatus = async (userId, friendId, newStatus) => {
    userId = validation.checkId(userId, "userId");
    friendId = validation.checkId(friendId, "friendId");
    if (!["pending", "rejected", "connected"].includes(newStatus)) {
        throw `Error: Invalid status '${newStatus}'`;
    }
    const userCollection = await users();

    if (newStatus === "rejected") {
        const rejectUpdateResult = await userCollection.updateOne(
            {'_id': new ObjectId(userId)},
            {$set: {[`friends.${friendId}`]: {status: newStatus}}}
        );
        if (rejectUpdateResult.modifiedCount === 0) {
            throw `Error: Failed to update friend status for user ${userId} to ${friendId}`;
        }
        const removeUpdateResult = await userCollection.updateOne(
            {'_id': new ObjectId(friendId)},
            {$unset: {[`friends.${userId}`]: ""}}
        );
        if (removeUpdateResult.modifiedCount === 0) {
            throw `Error: Failed to remove user ${userId} from user ${friendId}'s friend list`;
        }
        return {
            updatedStatus: true,
            message: `User ${userId} marked as rejected and removed from user ${friendId}'s friend list`
        };
    } else {
        const userUpdateResult = await userCollection.updateOne(
            {'_id': new ObjectId(userId)},
            {$set: {[`friends.${friendId}`]: {status: newStatus}}}
        );
        if (userUpdateResult.modifiedCount === 0) {
            throw `Error: Failed to update friend status for user ${userId} to ${friendId}`;
        }
        const friendUpdateResult = await userCollection.updateOne(
            {'_id': new ObjectId(friendId)},
            {$set: {[`friends.${userId}`]: {status: newStatus}}}
        );
        if (friendUpdateResult.modifiedCount === 0) {
            throw `Error: Failed to update friend status for user ${friendId} to ${userId}`;
        }
        return {updatedStatus: true, message: `Friend status updated to ${newStatus} for both users`};
    }
};


export const getUserInfoByUserId = async (
    userId
) => {
    userId = validation.checkId(userId, "userId");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});

    if (!user) {
        throw `Error: User with ID ${userId} not found`;
    }
    return {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,

    };
}

export const getUserInfoByEmail = async (
    email
) => {
    email = validation.validateEmail(email);
    const userCollection = await users();
    const user = await userCollection.findOne({email: email});

    if (!user) {
        throw `Error: User with email ${email} not found`;
    }
    return {
        userId: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        languages: user.languages,
        userSince: user.userSince,
        profilePictureLocation: user.profilePictureLocation,
        friends: user.friends
    };
}

export const getUserIdByEmail = async (
    email
) => {
    email = validation.validateEmail(email);
    const userCollection = await users();
    const user = await userCollection.findOne({email: email});

    if (!user) {
        throw `Error: User with email ${email} not found`;
    }
    return user._id.toString();
}

export const getUserPasswordById = async (
    userId
) => {
    userId = validation.checkId(userId, "userId");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});

    if (!user) {
        throw `Error: User with _id ${userId} not found`;
    }
    return {
        password: user.password
    };
}

export const getAllUsers = async () => {
    const userCollection = await users();
    const user = await userCollection.find({}).toArray();
    return user;
};