import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';

const styles = theme => ({
    formControl: {
        margin: theme.spacing.unit,
        width: '100%'
    }
});

const FormFieldInput = ({
    classes,
    schema,
    value,
    validationMessage,
    onChange
}) => {
    const handleChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <FormControl className={classes.formControl} error={!!validationMessage}>
            <InputLabel>{schema.label}</InputLabel>
            <Input
                type={schema.type || 'text'}
                value={String(value || '')}
                onChange={handleChange}
                name={schema.name}
            />
            {validationMessage && <FormHelperText>{validationMessage}</FormHelperText>}
        </FormControl>
    );
};

FormFieldInput.propTypes = {
    classes: PropTypes.object.isRequired,
    schema: PropTypes.shape({
        label: PropTypes.string,
        name: PropTypes.string,
        type: PropTypes.string
    }),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    validationMessage: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

FormFieldInput.defaultProps = {
    schema: {},
    value: '',
    validationMessage: ''
};

export default withStyles(styles)(FormFieldInput);
