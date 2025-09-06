//if you try to access api endpoints that do not exist, this middleware will create a 404 error and pass it to the error handler


const notFound = (req, res, next) => {
    const error = new Error('This page does not exist');
    error.status = 404; //Custom status code for demonstration purposes
    next(error); //Pass the error to the next middleware (error handler)
};

export default notFound;