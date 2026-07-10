export type GalleryFolder = {
  slug: string;
  createdAt?: string;
  count?: number;
  thumbnail?: {
    public_id: string;
    format: string;
    blurDataUrl?: string;
  };
};

export type GalleryImage = {
  id: number;
  public_id: string;
  format: string;
  width: number;
  height: number;
  isPortrait: boolean;
  tags: string[];
  blurDataUrl?: string;
};
