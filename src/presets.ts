const requestPromise = {
    transform: {
        "/node_modules/request-promise(-native)?/.+\\.js$": "jest-transform-stealthy-require"
    },
    transformIgnorePattern: "/node_modules(?!/request-promise(-native)?)/"
};

export {
    requestPromise
};
