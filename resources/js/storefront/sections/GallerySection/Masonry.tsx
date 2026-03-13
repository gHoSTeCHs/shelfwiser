import { useId } from 'react';

interface GalleryImage {
    url: string;
    alt?: string;
    caption?: string;
}

interface MasonryProps {
    images: GalleryImage[];
    columns?: number;
    onImageClick: (index: number) => void;
}

export function Masonry({ images, columns, onImageClick }: MasonryProps) {
    const masonryId = useId().replace(/:/g, '');
    const colCount = columns || 4;

    return (
        <>
            <style>{`
                #gallery-masonry-${masonryId} {
                    columns: 2;
                    column-gap: 1rem;
                }
                #gallery-masonry-${masonryId} > .masonry-item {
                    break-inside: avoid;
                    margin-bottom: 1rem;
                }
                @media (min-width: 640px) {
                    #gallery-masonry-${masonryId} { columns: 3; }
                }
                @media (min-width: 1024px) {
                    #gallery-masonry-${masonryId} { columns: ${colCount}; }
                }
            `}</style>
            <div id={`gallery-masonry-${masonryId}`}>
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => onImageClick(index)}
                        className="masonry-item group relative block w-full cursor-pointer overflow-hidden border-0 bg-transparent p-0"
                        style={{ borderRadius: 'var(--radius, 8px)' }}
                    >
                        <img
                            src={image.url}
                            alt={image.alt || ''}
                            className="block w-full transition-transform duration-500 group-hover:scale-105"
                        />
                        {image.caption && (
                            <div
                                className="absolute inset-x-0 bottom-0 px-3 py-2 text-left text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                style={{
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                                }}
                            >
                                {image.caption}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </>
    );
}
