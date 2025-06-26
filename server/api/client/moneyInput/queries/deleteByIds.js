import Input from '../model';

export default function deleteByIds(ids) {
    return Input.deleteMany({id: {$in: ids}});
}
