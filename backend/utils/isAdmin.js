const isAdmin = (user) => {
    return user && user.role === 'admin';
};

module.exports = { isAdmin };
