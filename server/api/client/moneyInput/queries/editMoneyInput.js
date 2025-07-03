import Input from '../model';

export default function editMoneyInput(input) {
    return Input.findOneAndUpdate({id: input.id}, input, {new: true});
}
