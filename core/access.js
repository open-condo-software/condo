const userIsAdmin = ({ authentication: { item: user } }) => Boolean(user && user.isAdmin);
const userIsThisItem = ({ existingItem, authentication: { item: user } }) => {
    if (!user || !existingItem) {
        return false;
    }
    return existingItem.id === user.id;
};

const userIsAdminOrIsThisItem = auth => {
    const isAdmin = userIsAdmin(auth);
    const isOwner = userIsThisItem(auth);
    return Boolean(isAdmin || isOwner);
};

const canReadOnlyActive = ({ authentication: { item: user } }) => {
    if (!user) return false;
    if (user.isAdmin) return {};

    // Approximately; users.filter(user => user.isActive === true);
    return {
        isActive: true,
    };
};

const canReadOnlyIfInUsers = ({ authentication: { item: user } }) => {
    if (!user) return false;
    if (user.isAdmin) return {};
    return {
        users_some: { id: user.id },
    }
};

const readOnlyField = {
    read: true,
    create: false,
    update: false,
};

module.exports = {
    userIsAdmin,
    userIsThisItem,
    userIsAdminOrIsThisItem,
    canReadOnlyActive,
    canReadOnlyIfInUsers,
    readOnlyField,
};
