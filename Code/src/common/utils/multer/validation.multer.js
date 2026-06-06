
export const fileFieldValidation = {
    image: ['image/jpeg', 'image/jpg', 'image/jpg', 'image/png'],
    video: ['vides/mp4']
};

export const fileFilter = (validation = []) => {
    return function (req, file, cb) {
        if (!validation.includes(file.mimetype)) {
            return cb(new Error("Invalid file format", { cause: { status: 400 } }), false);
        }
        return cb(null, true);
    };
};