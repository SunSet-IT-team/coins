import User from '../model';

export default function detachUserQuery(email) {
    return User.findOneAndUpdate({email}, {manager: null}, {new: true});
}
