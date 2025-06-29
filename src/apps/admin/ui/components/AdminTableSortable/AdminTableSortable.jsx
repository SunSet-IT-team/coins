import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';

import {withStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import ReorderIcon from '@material-ui/icons/Reorder';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

import AdminTableHeader from '../AdminTableHeader/AdminTableHeader.jsx';

import arrayMove from '../../../utils/arrayMove';

import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';

import difference from '@tinkoff/utils/array/difference';
import noop from '@tinkoff/utils/function/noop';
import any from '@tinkoff/utils/array/any';

const ButtonSortable = SortableHandle(({imageClassName}) => (
    <ReorderIcon className={imageClassName}> reorder </ReorderIcon>
));

const ItemSortable = SortableElement(
    ({index, isSelectedItem, onFormOpen, handleDelete, tableCells, value, classes}) => (
        <TableRow
            hover
            role="checkbox"
            aria-checked={isSelectedItem}
            tabIndex={-1}
            key={index}
            selected={isSelectedItem}
            className={classes.row}
        >
            <TableCell className={classes.tabButtonSortable} padding="checkbox">
                <ButtonSortable imageClassName={classes.buttonSortable} />
            </TableCell>
            {tableCells.map((tableCell, i) => (
                <TableCell className={classes.tableCell} key={i}>
                    {tableCell.prop(value)}
                </TableCell>
            ))}
            <TableCell
                padding="checkbox"
                align="right"
                className={classNames(classes.tableCell, classes.tableCellActions)}
            >
                <div className={classes.valueActions}>
                    <IconButton onClick={onFormOpen(value)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={handleDelete(value)}>
                        <DeleteIcon />
                    </IconButton>
                </div>
            </TableCell>
        </TableRow>
    )
);

const SortableWrapp = SortableContainer(
    ({
        values,
        page,
        rowsPerPage,
        onFormOpen,
        handleDelete,
        emptyRows,
        isSelected,
        tableCells,
        classes,
        ...rest
    }) => (
        <TableBody>
            {values.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((value, i) => {
                const isSelectedItem = isSelected(value.id);

                return (
                    <ItemSortable
                        {...rest}
                        key={i}
                        tableCells={tableCells}
                        isSelectedItem={isSelectedItem}
                        handleDelete={handleDelete}
                        onFormOpen={onFormOpen}
                        classes={classes}
                        value={value}
                        index={i}
                    />
                );
            })}
            {emptyRows > 0 && (
                <TableRow style={{height: 49 * emptyRows}}>
                    <TableCell colSpan={6} className={classes.tableCell} />
                </TableRow>
            )}
        </TableBody>
    )
);

const materialStyles = (theme) => ({
    paper: {
        paddingRight: theme.spacing.unit,
    },
    table: {
        width: '100%',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    row: {
        backgroundColor: '#fff',
        width: '1912px',
        '&:hover $valueActions': {
            visibility: 'visible',
        },
    },
    tabButtonSortable: {
        display: 'table-cell',
        textAlign: 'left',
        width: '239px',
        '@media (max-width:1200px)': {
            width: 'auto',
        },
    },
    tableCell: {
        color: 'rgba(0, 0, 0, 0.87)',
        fontSize: '0.8125rem',
        fontWeight: '400',
        display: 'table-cell',
        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        textAlign: 'left',
        width: '438px',
        '@media (max-width:780px)': {
            width: 'auto',
            padding: '4px 12px',
        },
    },
    tableCellActions: {
        textAlign: 'right',
    },
    buttonSortable: {
        position: 'relative',
        top: '4px',
        marginRight: '12px',
        cursor: 'pointer',
    },
    valueActions: {
        visibility: 'hidden',
        '@media (max-width:780px)': {
            visibility: 'visible',
        },
    },
    tableCellHead: {
        '@media (max-width:780px)': {
            width: 'auto',
            padding: '4px 24px',
        },
        '@media (max-width:500px)': {
            width: 'auto',
            padding: '4px 12px',
        },
    },
});

const ROWS_PER_PAGE = 10;

class AdminTableSortable extends React.Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        headerRows: PropTypes.array,
        tableCells: PropTypes.array,
        values: PropTypes.array,
        headerText: PropTypes.string,
        deleteValueWarningTitle: PropTypes.string,
        deleteValuesWarningTitle: PropTypes.string,
        onDelete: PropTypes.func,
        onFormOpen: PropTypes.func,
        onChange: PropTypes.func,
        onFiltersOpen: PropTypes.func,
        filters: PropTypes.bool,
    };

    static defaultProps = {
        headerRows: [],
        tableCells: [],
        values: [],
        headerText: '',
        deleteValueWarningTitle: '',
        deleteValuesWarningTitle: '',
        onDelete: noop,
        onFormOpen: noop,
        onChange: noop,
        onFiltersOpen: noop,
        filters: false,
    };

    constructor(...args) {
        super(...args);

        const {values} = this.props;

        this.state = {
            selected: [],
            values,
            page: 0,
            rowsPerPage: values.length > ROWS_PER_PAGE ? ROWS_PER_PAGE : values.length,
            checkboxIndeterminate: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.values !== this.props.values) {
            this.setState({
                rowsPerPage:
                    nextProps.values.length > ROWS_PER_PAGE
                        ? ROWS_PER_PAGE
                        : nextProps.values.length,
                selected: [],
                values: nextProps.values,
            });
        }
    }

    handleSelectedCloseClick = () => {
        this.setState({
            selected: [],
            checkboxIndeterminate: false,
        });
    };

    handleChangePage = (event, page) => {
        const checkboxIndeterminate = this.checkCheckboxIndeterminate({page});

        this.setState({page, checkboxIndeterminate});
    };

    handleChangeRowsPerPage = ({target: {value}}) => {
        const {values} = this.state;
        const rowsPerPage = values.length > value ? value : values.length;
        const checkboxIndeterminate = this.checkCheckboxIndeterminate({rowsPerPage});

        this.setState({rowsPerPage, checkboxIndeterminate});
    };

    handleDelete = (value) => () => {
        this.setState({
            valueForDelete: value,
        });
    };

    handleWarningDisagree = () => {
        this.setState({
            valueForDelete: null,
        });
    };

    handleWarningAgree = () => {
        const {valueForDelete} = this.state;

        this.props.onDelete([valueForDelete.id]).then(() => {
            this.setState({
                valueForDelete: null,
            });
        });
    };

    checkCheckboxIndeterminate = ({
        rowsPerPage = this.state.rowsPerPage,
        page = this.state.page,
        selected = this.state.selected,
    } = {}) => {
        const {values} = this.state;
        const visibleValues = values.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

        return !difference(visibleValues, selected).length;
    };

    isSelected = (id) => any((value) => value.id === id, this.state.selected);

    onDragEnd = ({oldIndex, newIndex}) => {
        const {values} = this.state;
        const newValues = arrayMove(values, oldIndex, newIndex).map((value, i) => {
            return {...value, positionIndex: i};
        });

        this.setState({
            values: newValues,
        });

        this.props.onChange(newValues.map(({id}) => id));
    };

    render() {
        const {
            classes,
            headerRows,
            tableCells,
            headerText,
            deleteValueWarningTitle,
            deleteValuesWarningTitle,
            filters,
        } = this.props;
        const {selected, rowsPerPage, page, values, valueForDelete} = this.state;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, values.length - page * rowsPerPage);

        return (
            <Paper className={classes.paper}>
                <AdminTableHeader
                    headerText={headerText}
                    deleteValuesWarningTitle={deleteValuesWarningTitle}
                    selected={selected}
                    onDelete={this.props.onDelete}
                    onSelectedCloseClick={this.handleSelectedCloseClick}
                    onFormOpen={this.props.onFormOpen}
                    onFiltersOpen={this.props.onFiltersOpen}
                    filters={filters}
                />
                <div className={classes.tableWrapper}>
                    <Table className={classes.table} aria-labelledby="tableTitle">
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                {headerRows.map((row, i) => (
                                    <TableCell key={i} className={classes.tableCellHead}>
                                        {row.label}
                                    </TableCell>
                                ))}
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <SortableWrapp
                            axis="xy"
                            onFormOpen={this.props.onFormOpen}
                            handleDelete={this.handleDelete}
                            tableCells={tableCells}
                            emptyRows={emptyRows}
                            rowsPerPage={rowsPerPage}
                            isSelected={this.isSelected}
                            values={values}
                            page={page}
                            onSortEnd={this.onDragEnd}
                            useDragHandle
                            classes={classes}
                        />
                    </Table>
                </div>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 30]}
                    component="div"
                    count={values.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                />
                <Dialog open={!!valueForDelete} onClose={this.handleWarningDisagree}>
                    <DialogTitle>{deleteValueWarningTitle}</DialogTitle>
                    <DialogContent className={classes.warningContent}>
                        <DialogContentText>
                            {valueForDelete && valueForDelete.name}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleWarningDisagree} color="primary">
                            Нет
                        </Button>
                        <Button onClick={this.handleWarningAgree} color="primary" autoFocus>
                            Да
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        );
    }
}

export default withStyles(materialStyles)(AdminTableSortable);
