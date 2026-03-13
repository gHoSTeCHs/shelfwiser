import { useId } from 'react';

interface GalleryImage {
    url: string;
    alt?: string;
    caption?: string;
}

interface GridProps {
    images: GalleryImage[];
    columns?: number;
    onImageClick: (index: number) => void;
}

export function Grid({ images, columns, onImageClick }: GridProps) {
    const gridId = useId().replace(/:/g, '');
    const colCount = columns || 4;

    return (
        <>
            <style>{`
                #gallery-grid-${gridId} {
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: repeat(2, 1fr);
                }
                @media (min-width: 640px) {
                    #gallery-grid-${gridId} { grid-template-columns: repeat(3, 1fr); }
                }
                @media (min-width: 1024px) {
                    #gallery-grid-${gridId} { grid-template-columns: repeat(${colCount}, 1fr); }
                }
            `}</style>
            <div id={`gallery-grid-${gridId}`}>
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => onImageClick(index)}
                        className="group relative cursor-pointer overflow-hidden border-0 bg-transparent p-0"
                        style={{
                            borderRadius: 'var(--radius, 8px)',
                            aspectRatio: '1/1',
                        }}
                    >
                        <img
                            src={image.url}
                            alt={image.alt || ''}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
