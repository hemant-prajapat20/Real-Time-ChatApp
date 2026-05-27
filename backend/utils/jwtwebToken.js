import jwt from "jsonwebtoken"

const jwtToken = (userId, res) => {
    if (!process.env.JWT_SECRET) {
        console.error('JWT secret is not defined');
        return res.status(500).send({ success: false, message: 'Server configuration error' });
    }
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
    const isProduction = process.env.NODE_ENV === 'production'
    res.cookie('jwt', token, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
        httpOnly: true,
        sameSite: "strict",
        secure: isProduction // HTTPS only in production
    })
}
export default jwtToken