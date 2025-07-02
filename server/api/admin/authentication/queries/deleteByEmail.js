import Admin from '../model';

export default function deleteByEmail(email) {
    return Admin.deleteOne({email});
}
