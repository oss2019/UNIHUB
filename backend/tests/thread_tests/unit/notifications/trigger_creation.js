import axios from 'axios';

export const trigger = async (token, data) => {
    try {
        const response = await axios.post('http://localhost:5000/api/threads', data, {
            headers: {
                Cookie: `accessToken=${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) return error.response.data;
        return { success: false, error: error.message || 'Unknown network error' };
    }
};
