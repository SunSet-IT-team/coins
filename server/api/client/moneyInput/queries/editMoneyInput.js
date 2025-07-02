import Input from '../model';

export default function editMoneyOutput(input) {
    return Input.findOneAndUpdate({id: input.id}, input, {new: true});
}
