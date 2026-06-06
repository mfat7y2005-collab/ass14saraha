import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: function (req) {
        const { country } = geoip.lookup(req.ip);
        return country == "EG" ? 5 : 3;
    },
    skipFailedRequests: true,
    handler: (req, res, next) => {
        return res.status(429).json({ message: "Too many requests" });
    },
    keyGenerator: function (req, res, next) {
        const ipV6 = ipKeyGenerator(req.ip, 56);
        return `${ipV6}-${req.path}`;
    },
    store: {
        async incr(key, cb) {
            try {
                const count = await redisClient.incr(key);
                if (count === 1) await redisClient.expire(key, 120);
                cb(null, count);
            } catch (error) {
                cb(error);
            }
        },
        async resetKey(key) {
            await redisClient.del(key);
        },
        async decrement(key) {
            await redisClient.decr(key);
        }
    }
});

export const limiterLogin = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: function (req) {
        const { country } = geoip.lookup(req.ip);
        return country == "EG" ? 5 : 3;
    },
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    handler: (req, res, next) => {
        return res.status(429).json({ message: "Too many login requests" });
    },
    keyGenerator: function (req, res, next) {
        const ipV6 = ipKeyGenerator(req.ip, 56);
        return `${ipV6}-${req.path}`;
    },
    store: {
        async incr(key, cb) {
            try {
                const count = await redisClient.incr(key);
                if (count === 1) await redisClient.expire(key, 120);
                cb(null, count);
            } catch (error) {
                cb(error);
            }
        },
        async resetKey(key) {
            await redisClient.del(key);
        },
        async decrement(key) {
            await redisClient.decr(key);
        }
    }
}); 