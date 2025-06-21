import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';

const styles = (theme) => ({
    formControl: {
        margin: theme.spacing.unit,
        width: '100%',
    },
});

const FormFieldInput = ({classes, schema, value, name, validationMessage, onChange}) => {
    const handleChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <FormControl className={classes.formControl} error={!!validationMessage}>
            <InputLabel>{schema.label}</InputLabel>
            <Input
                type={schema.type || 'text'}
                value={
                    value !== undefined && value !== null && !Number.isNaN(value)
                        ? String(value)
                        : ''
                }
                name={name}
                defaultValue={schema.defaultValue}
                onChange={handleChange}
                readOnly={schema.readOnly}
            />
            {/* {validationMessage && (
        <FormHelperText>{validationMessage}</FormHelperText>
      )} */}
        </FormControl>
    );
};

FormFieldInput.propTypes = {
    classes: PropTypes.object.isRequired,
    schema: PropTypes.shape({
        label: PropTypes.string,
        type: PropTypes.string,
        readOnly: PropTypes.bool,
    }),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    validationMessage: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

FormFieldInput.defaultProps = {
    schema: {},
    value: '',
    validationMessage: '',
};

export default withStyles(styles)(FormFieldInput);
