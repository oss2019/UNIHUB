import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const parseUrl = (url) => {
    if (!url) return {};
    const regex = /cloudinary:\/\/([^:]+):([^@]+)@(.+)/;
    const match = url.match(regex);
    if (!match) return {};
    return {
        api_key: match[1],
        api_secret: match[2],
        cloud_name: match[3]
    };
};

const config = parseUrl(process.env.CLOUDINARY_URL);
cloudinary.config({
    ...config,
    secure: true
});

export default cloudinary;
