
module.exports ={
     isAuthenticatedAdmin:(req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        req.flash('error', 'You Have To Login First')
        res.redirect('/');
    }
}
}