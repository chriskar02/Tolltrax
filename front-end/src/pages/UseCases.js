import React from 'react';

const UserCase = ({ title }) => {
  return (
    <div className="container mt-5">
      <h1>{title}</h1>
      <p>Details about {title}.</p>
    </div>
  );
};

export const UserCase1 = () => <UserCase title="User Case 1" />;
export const UserCase2 = () => <UserCase title="User Case 2" />;
export const UserCase3 = () => <UserCase title="User Case 3" />;
