import React from 'react';
import Avatar from 'react-avatar';

const Client = ({ username }) => {
    return (
        <div className="client">
            <span className="clientAvatar">
                <Avatar name={username} size={32} round="10px" textSizeRatio={2.4} />
                <i className="presenceDot" />
            </span>
            <span className="userName">{username}</span>
            <span className="clientTag">live</span>
        </div>
    );
};

export default Client;
