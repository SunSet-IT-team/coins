import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormHelperText from '@material-ui/core/FormHelperText';

const styles = (theme) => ({
    formControl: {
        margin: theme.spacing.unit,
        width: '100%',
    },
    formLabel: {
        marginBottom: theme.spacing.unit,
    },
});

const FormFieldRadios = ({classes, schema, value, name, validationMessage, onChange, error}) => {
    const handleChange = (event) => {
        onChange(event.target.value);
    };

    return (
        <div className={classes.formControl}>
            <FormLabel className={classes.formLabel}>{schema.label}</FormLabel>
            <RadioGroup value={value || ''} onChange={handleChange} name={name}>
                <FormGroup>
                    {(schema.options || []).map((option, i) => (
                        <FormControlLabel
                            key={i}
                            value={option.value}
                            control={<Radio />}
                            label={option.label}
                        />
                    ))}
                </FormGroup>
            </RadioGroup>
            {validationMessage && (
                <FormHelperText error={error}>{validationMessage}</FormHelperText>
            )}
        </div>
    );
};

FormFieldRadios.propTypes = {
    classes: PropTypes.object.isRequired,
    schema: PropTypes.shape({
        label: PropTypes.string,
        name: PropTypes.string,
        options: PropTypes.arrayOf(
            PropTypes.shape({
                label: PropTypes.string,
                value: PropTypes.string,
            })
        ),
    }),
    value: PropTypes.string,
    name: PropTypes.string,
    validationMessage: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    error: PropTypes.bool,
};

FormFieldRadios.defaultProps = {
    schema: {
        options: [],
    },
    value: '',
    name: '',
    validationMessage: '',
    error: false,
};

export default withStyles(styles)(FormFieldRadios);
