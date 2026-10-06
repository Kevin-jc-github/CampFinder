const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    }
});

UserSchema.plugin(passportLocalMongoose, { usernameLowerCase: true, errorMessages: { UserExistsError: '该用户名已被注册' } });

module.exports = mongoose.model('User', UserSchema);
