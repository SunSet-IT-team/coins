import Admin from '../model';

export default function getAllManagers () {
    return Admin.find({ id: 'manager_id' });
}
