import User from '../model';

export default function assignUser(user) {
    return User.findOneAndUpdate({email: user.email}, {manager: user.manager}, {new: true});
}
