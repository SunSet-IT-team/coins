import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import noop from '@tinkoff/utils/function/noop';

import blue from '@material-ui/core/colors/blue';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import AccountCircleRoundedIcon from '@material-ui/icons/AccountCircleRounded';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';

import {withStyles} from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';

import UserForm from '../../components/UserForm/UserForm';

import arrayMove from '../../../utils/arrayMove';

import getManagers from '../../../services/getManagers';
import createManager from '../../../services/createManager';
import deleteManager from '../../../services/deleteManager';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import classNames from 'classnames';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Snackbar from '@material-ui/core/Snackbar';

import ErrorIcon from '@material-ui/icons/Error';

const ItemSortable = ({onUserDelete, name, value, classes}) => (
    <ListItem button className={classes.row}>
        <ListItemIcon>
            <AccountCircleRoundedIcon
                {...(value.isActive === 'true'
                    ? {style: {color: green[300]}}
                    : value.isActive === 'false'
                      ? {style: {color: red[300]}}
                      : {})}
                fontSize="large"
            />
        </ListItemIcon>
        <ListItemText
            primary={
                <div>
                    {name && <span className={classes.nameText}>{name} </span>}
                    <span className={classes.emailText}>{value.email}</span>
                </div>
            }
        />
        {value.hidden && <div className={classes.hiddenMark}>Hidden</div>}
        <div className={classes.valueActions}>
            <ListItemSecondaryAction className={classes.userOptions}>
                <IconButton onClick={() => onUserDelete(value)} edge="end" aria-label="delete">
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>
        </div>
    </ListItem>
);

ItemSortable.propTypes = {
    onUserDelete: PropTypes.func,
    name: PropTypes.string,
    value: PropTypes.object,
    classes: PropTypes.object,
};

const SortableWrapper = ({managers, ...rest}) => (
    <List>
        {managers.map((value, i) => {
            const name = [value.name, value.surname].filter(Boolean).join(' ');
            return (
                <ItemSortable
                    key={i}
                    name={name}
                    value={value}
                    onUserDelete={rest.onUserDelete}
                    {...rest}
                />
            );
        })}
    </List>
);

SortableWrapper.propTypes = {
    managers: PropTypes.array,
};

const materialStyles = (theme) => ({
    root: {
        display: 'grid',
        gridTemplateColumns: '60% 40%',
        '@media (max-width:1200px)': {
            display: 'grid',
            gridTemplateColumns: '60% 40%',
            flexDirection: 'column-reverse',
        },
    },
    addForm: {
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '8px',
    },
    addInput: {
        width: '100%',
        padding: '8px',
        margin: '4px 0',
        border: '1px solid rgba(0, 0, 0, 0.23)',
        borderRadius: '4px',
        outline: 'none',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
        '&:focus': {
            borderColor: theme.palette.grey[500],
        },
    },
    addButton: {
        background: 'linear-gradient(to right, #3f51b5 0%,rgb(82, 97, 185) 100%)',
        color: 'white',
        padding: '10px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
        '&:hover': {
            backgroundColor: blue[700],
        },
    },
    drawer: {
        display: 'grid',

        flexShrink: 0,
        '@media (max-width:1200px)': {
            width: 'calc(100% - 60px)',
            maxWidth: 'unset',
            margin: '30px 30px 0 30px',
            boxShadow:
                '0px 1px 5px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)',
        },
        '@media (max-width:600px)': {
            width: 'calc(100% - 30px)',
            margin: '15px 15px 0 15px',
        },
        '@media (max-width:400px)': {
            width: '100%',
            margin: '15px 0 0 0',
        },
    },
    drawerPaper: {
        display: 'grid',
        gridTemplateRows: 'auto auto auto auto 1fr auto',
        flex: '1 0 auto',
        height: '100%',
        outline: '0',
        position: 'inherit',
        overflowY: 'hidden',
        top: 'auto',
        zIndex: '1',

        '@media (max-width:1200px)': {
            zIndex: '0',
            minHeight: 'unset',
            width: '100%',
            maxWidth: 'unset',
        },
    },
    content: {
        '@media (max-width:1200px)': {
            width: '100%',
        },
        '@media (max-width:600px)': {
            padding: '15px',
        },
        '@media (max-width:400px)': {
            padding: '15px 0',
        },
    },
    hiddenMark: {
        width: '64px',
        height: '24px',
        borderRadius: '52px',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
        textAlign: 'center',
        padding: '5px 0px 0px 0px',
        background: '#3f51b5',
        color: 'white',
    },
    toolbar: {
        height: '0px',
    },
    toolbarNav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '58px',
        padding: '5px 30px 5px 30px',
        '@media (max-width:460px)': {
            padding: '5px 16px 5px 16px',
        },
    },
    userTitle: {
        height: '30px',
        padding: '0 16px',
    },
    buttonSortable: {
        position: 'relative',
        marginRight: '12px',
        cursor: 'pointer',
    },
    modal: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        backgroundColor: 'white',
        zIndex: 1201,
        '&:hover $valueActions': {
            visibility: 'visible',
        },
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.07)',
        },
    },
    valueActions: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
    },
    userOptions: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
    },
    listItemText: {
        cursor: 'default',
        flex: 1,
        '& .MuiListItemText-primary': {
            '& .emailText': {
                color: 'rgba(0, 0, 0, 0.54)',
                marginLeft: '8px',
            },
            '& .nameText': {
                color: 'rgba(0, 0, 0, 0.87)',
            },
        },
    },
    modalContent: {
        position: 'absolute',
        width: '1200px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing.unit * 4,
        outline: 'none',
        overflowY: 'auto',
        maxHeight: '100vh',
        '@media (max-width:1300px)': {
            width: '90%',
        },
    },
    loader: {
        height: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsBlock: {
        backgroundColor: blue[50],
        borderRadius: '3px',
        padding: '20px',
    },
    columns: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    userColWrapper: {
        width: '100%',
        flex: 1,
        minWidth: 0,
    },

    search: {
        display: 'flex',
        padding: '8px 16px',
    },
    searchIcon: {
        marginRight: '10px',
    },
    searchInput: {
        width: '100%',
        border: 'none',
        outline: 'none',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '14px',
    },
    success: {
        backgroundColor: theme.palette.success.main,
    },
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    icon: {
        fontSize: 20,
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing.unit,
    },
    message: {
        display: 'flex',
        alignItems: 'center',
    },
    margin: {
        margin: theme.spacing.unit,
    },
    nameText: {
        color: 'rgba(0, 0, 0, 0.87)',
    },
    emailText: {
        color: 'rgba(0, 0, 0, 0.54)',
    },
});

const mapStateToProps = ({data}) => {
    return {
        managers: data.managers,
    };
};

const mapDispatchToProps = (dispatch) => ({
    getManagers: (payload) => dispatch(getManagers(payload)),
    deleteManager: (payload) => dispatch(deleteManager(payload)),
    createManager: (payload) => dispatch(createManager(payload)),
});

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DEFAULT_LANG = 'ru';
const DEFAULT_ACTIVE_SERVICE = {name: '', id: ''};

class SettingsPage extends Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        managers: PropTypes.array.isRequired,
        getManagers: PropTypes.func.isRequired,
        deleteManager: PropTypes.func.isRequired,
        createManager: PropTypes.func.isRequired,
    };

    static defaultProps = {
        managers: [],
        getManagers: noop,
        deleteManager: noop,
        createManager: noop,
    };

    state = {
        loading: true,
        activeUser: DEFAULT_ACTIVE_SERVICE,
        userFormShowed: false,
        editableUser: {},
        managers: [],
        lang: DEFAULT_LANG,
        valueForDelete: null,
        tabsValue: 0,
        inputValue: '',
        isClickedSubmit: false,
        showSuccess: false,
        errorText: '',
        newManager: {
            name: '',
            surname: '',
            email: '',
            password: '',
        },
    };

    componentDidUpdate(prevProps) {
        if (prevProps.managers !== this.props.managers) {
            this.setState({managers: this.props.managers});
        }
    }

    componentDidMount() {
        Promise.all([this.props.getManagers()]).then(() => {
            this.setState({
                loading: false,
                managers: this.props.managers,
                activeManager: this.props.managers[0] || DEFAULT_ACTIVE_SERVICE,
            });
        });
    }

    newManagerValidators = [
        ({password}) => (password.length >= 8 ? null : 'Длина пароля должна быть не меньше восьми'),
        ({password}) =>
            /[а-яА-Я]/g.test(password) ? 'Пароль не должен содержать кириллицу' : null,
        ({password}) => (/ /g.test(password) ? 'Пароль не должен содержать пробелов' : null),
        ({password}) => (/[0-9]/g.test(password) ? null : 'В пароле должны использоваться цифры'),
        ({email}) => (EMAIL_PATTERN.test(email) ? null : 'Введите валидный email'),
    ];

    validateManager = (manager) => {
        const errors = [];
        this.newManagerValidators.forEach((validator) => {
            const error = validator(manager);
            if (error) errors.push(error);
        });
        return errors;
    };

    handleAddManager = () => {
        const {newManager} = this.state;

        const errors = this.validateManager(newManager);
        if (errors.length > 0) {
            this.setState({errorText: errors[0]});
            return;
        }

        this.props
            .createManager(newManager)
            .then(() => {
                this.setState({
                    newManager: {
                        name: '',
                        surname: '',
                        email: '',
                        password: '',
                    },
                    showSuccess: true,
                });
            })
            .catch((error) => {
                this.setState({
                    errorText: error.message || 'Ошибка при создании менеджера',
                });
            });
    };

    handleManagerDelete = (manager) => {
        this.setState({
            valueForDelete: manager,
        });
    };

    handleWarningDisagree = () => {
        this.setState({
            valueForDelete: null,
        });
    };

    handleWarningAgree = () => {
        const {valueForDelete, activeManager, managers} = this.state;

        this.props.deleteManager(valueForDelete.email).then(() => {
            this.setState({
                managers: this.props.managers,
                activeManager:
                    (activeManager === valueForDelete && managers[0]) || DEFAULT_ACTIVE_SERVICE,
                valueForDelete: null,
            });
        });
    };

    onDragEnd = ({oldIndex, newIndex}) => {
        const {managers} = this.state;
        const newValues = arrayMove(managers, oldIndex, newIndex);

        newValues.forEach((newManager, i) => {
            newManager.positionIndex = i;

            this.props.createManager(newManager);
        });

        this.setState({
            managers: newValues,
        });
    };

    handleTableChange = (event) => () => {
        this.setState({
            tabsValue: event,
        });
    };

    handleSearch = (e) => {
        const searchValue = e.target.value.toLowerCase();
        const {managers} = this.props;

        const filteredManagers = searchValue
            ? managers.filter(
                  (manager) =>
                      (manager.name || '').toLowerCase().includes(searchValue) ||
                      (manager.surname || '').toLowerCase().includes(searchValue) ||
                      (manager.email || '').toLowerCase().includes(searchValue)
              )
            : managers;

        this.setState({
            inputValue: e.target.value,
            managers: filteredManagers,
        });
    };

    handleSuccesslMessage = () => {
        this.setState({
            showSuccess: false,
        });
    };

    handleHideFailMessage = () => {
        this.setState({
            errorText: '',
        });
    };

    render() {
        const {classes} = this.props;
        const {
            editableManager,
            valueForDelete,
            managers,
            lang,
            userFormShowed,
            loading,
            inputValue,
            showSuccess,
            errorText,
        } = this.state;

        if (loading) {
            return (
                <div className={classes.loader}>
                    <CircularProgress />
                </div>
            );
        }

        return (
            <main className={classes.root}>
                <div className={classes.boom}>{/* Место для будущих настроек */}</div>
                <Drawer
                    className={classes.drawer}
                    variant="permanent"
                    anchor="right"
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                >
                    <div className={classes.toolbarNav}>
                        <Typography variant="h6" className={classes.userTitle}>
                            Менеджеры
                        </Typography>
                    </div>
                    <Divider />
                    <div className={classes.userTypes}>
                        <div className={classes.search}>
                            <div className={classes.searchIcon}>
                                <SearchIcon />
                            </div>
                            <input
                                placeholder="Поиск…"
                                className={classes.searchInput}
                                value={inputValue}
                                onChange={this.handleSearch}
                            />
                        </div>
                    </div>
                    <Divider />
                    <div className={classes.toolbar} />
                    <div className={classes.columns}>
                        <div className={classes.userColWrapper}>
                            <SortableWrapper
                                axis="xy"
                                onUserDelete={this.handleManagerDelete}
                                managers={managers}
                                lang={lang}
                                classes={classes}
                            />
                        </div>
                    </div>
                    <div className={classes.userTypes}>
                        <div className={classes.addForm}>
                            <input
                                placeholder="Имя"
                                className={classes.addInput}
                                value={this.state.newManager.name}
                                onChange={(e) =>
                                    this.setState({
                                        newManager: {
                                            ...this.state.newManager,
                                            name: e.target.value,
                                        },
                                    })
                                }
                            />
                            <input
                                placeholder="Фамилия"
                                className={classes.addInput}
                                value={this.state.newManager.surname}
                                onChange={(e) =>
                                    this.setState({
                                        newManager: {
                                            ...this.state.newManager,
                                            surname: e.target.value,
                                        },
                                    })
                                }
                            />
                            <input
                                placeholder="Email"
                                className={classes.addInput}
                                value={this.state.newManager.email}
                                onChange={(e) =>
                                    this.setState({
                                        newManager: {
                                            ...this.state.newManager,
                                            email: e.target.value,
                                        },
                                    })
                                }
                            />
                            <input
                                type="password"
                                placeholder="Пароль"
                                className={classes.addInput}
                                value={this.state.newManager.password}
                                onChange={(e) =>
                                    this.setState({
                                        newManager: {
                                            ...this.state.newManager,
                                            password: e.target.value,
                                        },
                                    })
                                }
                            />
                            <button className={classes.addButton} onClick={this.handleAddManager}>
                                Добавить
                            </button>
                        </div>
                    </div>
                </Drawer>
                <Modal
                    open={userFormShowed}
                    onClose={this.handleCloseUserForm}
                    className={classes.modal}
                    disableEnforceFocus
                >
                    <Paper className={classes.modalContent}>
                        <UserForm
                            users={managers}
                            user={editableManager}
                            onDone={this.handleUserFormDone}
                        />
                    </Paper>
                </Modal>
                <Dialog open={!!valueForDelete} onClose={this.handleWarningDisagree}>
                    <DialogTitle>Вы точно хотите удалить менеджера?</DialogTitle>
                    <DialogContent className={classes.warningContent}>
                        <DialogContentText>
                            {valueForDelete && valueForDelete.title}
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

                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    onClose={this.handleSuccesslMessage}
                    open={showSuccess}
                    autoHideDuration={3000}
                >
                    <SnackbarContent
                        className={classNames(classes.success, classes.margin)}
                        message={
                            <span id="client-snackbar" className={classes.message}>
                                <CheckCircleIcon
                                    className={classNames(classes.icon, classes.iconVariant)}
                                />
                                Операция успешно сохранена
                            </span>
                        }
                    />
                </Snackbar>

                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    onClose={this.handleHideFailMessage}
                    open={!!errorText}
                    autoHideDuration={2000}
                >
                    <SnackbarContent
                        className={classNames(classes.error, classes.margin)}
                        message={
                            <span id="client-snackbar" className={classes.message}>
                                <ErrorIcon
                                    className={classNames(classes.icon, classes.iconVariant)}
                                />
                                {errorText}
                            </span>
                        }
                    />
                </Snackbar>
            </main>
        );
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(materialStyles)(SettingsPage));
