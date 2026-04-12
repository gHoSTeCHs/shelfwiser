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
                    gap: 0.75rem;
                    grid-template-columns: repeat(2, 1fr);
                }
                @media (min-width: 640px) {
                    #gallery-grid-${gridId} {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1rem;
                    }
                }
                @media (min-width: 1024px) {
                    #gallery-grid-${gridId} { grid-template-columns: repeat(${colCount}, 1fr); }
                }
                #gallery-grid-${gridId} .gallery-item {
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    aspect-ratio: 1/1;
                    background-color: var(--color-surface, #f3f4f6);
                    border: 0;
                    padding: 0;
                    border-radius: var(--radius, 8px);
                }
                #gallery-grid-${gridId} .gallery-item img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
                }
                #gallery-grid-${gridId} .gallery-item:hover img {
                    transform: scale(1.06);
                }
                #gallery-grid-${gridId} .gallery-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 40%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    display: flex;
                    align-items: flex-end;
                    padding: 16px;
                }
                #gallery-grid-${gridId} .gallery-item:hover .gallery-overlay {
                    opacity: 1;
                }
                #gallery-grid-${gridId} .gallery-zoom {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background-color: rgba(255,255,255,0.95);
                    color: var(--color-foreground, #111);
                    opacity: 0;
                    transform: translateY(-4px);
                    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                }
                #gallery-grid-${gridId} .gallery-item:hover .gallery-zoom {
                    opacity: 1;
                    transform: translateY(0);
                }
                #gallery-grid-${gridId} .gallery-caption {
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff;
                    font-family: var(--font-body, sans-serif);
                    letter-spacing: -0.005em;
                    text-align: left;
                    line-height: 1.4;
                }
            `}</style>
            <div id={`gallery-grid-${gridId}`}>
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => onImageClick(index)}
                        className="gallery-item group"
                        aria-label={image.alt || `Open image ${index + 1}`}
                    >
                        <img src={image.url} alt={image.alt || ''} loading="lazy" />

                        <span className="gallery-zoom" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </span>

                        <div className="gallery-overlay">
                            {image.caption && (
                                <span className="gallery-caption">{image.caption}</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </>
    );
}
