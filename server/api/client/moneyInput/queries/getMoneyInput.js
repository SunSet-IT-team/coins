import Input from '../model';

export default function getMoneyInput(query = {}) {
    return Input.find(query);
}
