import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
    return (
        <div className={`animate-pulse bg-gray-800 rounded-md ${className}`} />
    );
};
