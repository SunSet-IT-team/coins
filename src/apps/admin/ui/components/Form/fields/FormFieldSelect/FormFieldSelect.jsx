import React, { useState } from "react"
import PropTypes from "prop-types"
import { withStyles } from "@material-ui/core/styles"
import FormControl from "@material-ui/core/FormControl"
import Select from "@material-ui/core/Select"
import MenuItem from "@material-ui/core/MenuItem"
import FormHelperText from "@material-ui/core/FormHelperText"
import TextField from "@material-ui/core/TextField"

const styles = (theme) => ({
  formControl: {
    margin: theme.spacing.unit,
    width: "100%",
  },
  searchField: {
    marginBottom: theme.spacing.unit,
  },
  select: {
    marginTop: theme.spacing.unit,
  },
})

const FormFieldSelect = ({
  classes,
  schema,
  value,
  name,
  validationMessage,
  onChange,
}) => {
  const [searchText, setSearchText] = useState("")

  const handleChange = (event) => {
    onChange(event.target.value)
  }

  const handleSearchChange = (event) => {
    setSearchText(event.target.value.toLowerCase())
  }

  const filteredOptions = schema.options.filter((option) => {
    const searchLower = searchText.toLowerCase()
    const label = (option.label || option.name).toLowerCase()
    const value = (option.value || option.name).toLowerCase()
    return label.includes(searchLower) || value.includes(searchLower)
  })

  return (
    <FormControl className={classes.formControl} error={!!validationMessage}>
      {schema.isSearchable && (
        <TextField
          className={classes.searchField}
          placeholder="Поиск..."
          value={searchText}
          onChange={handleSearchChange}
          name={schema.searchFieldName}
          fullWidth
        />
      )}
      <Select
        className={classes.select}
        value={value || ""}
        name={name}
        onChange={handleChange}
      >
        {filteredOptions.map((option, i) => (
          <MenuItem key={i} value={option.value || option.name}>
            {option.label || option.name}
          </MenuItem>
        ))}
      </Select>
      {validationMessage && (
        <FormHelperText>{validationMessage}</FormHelperText>
      )}
    </FormControl>
  )
}

FormFieldSelect.propTypes = {
  classes: PropTypes.object.isRequired,
  schema: PropTypes.shape({
    label: PropTypes.string,
    searchFieldName: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string,
        name: PropTypes.string,
      })
    ),
    isSearchable: PropTypes.bool,
  }),
  value: PropTypes.string,
  name: PropTypes.string,
  validationMessage: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

FormFieldSelect.defaultProps = {
  schema: {
    options: [],
  },
  value: "",
  name: "",
  validationMessage: "",
}

export default withStyles(styles)(FormFieldSelect)
