import User from '../model';

export default function getAllManagers () {
    return User.find({});
}
