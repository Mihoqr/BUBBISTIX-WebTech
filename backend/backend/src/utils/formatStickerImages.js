// Base S3 URL used to generate public file URLs
const S3_BASE_URL =
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// Convert stored S3 file keys into full public URLs
export const formatStickerImages = (sticker) => {
  const stickerObj = sticker.toObject ? sticker.toObject() : sticker;

  if (stickerObj.preview_images?.length) {
    stickerObj.preview_images = stickerObj.preview_images.map(
      img => `${S3_BASE_URL}/${img}`
    );
  }

  return stickerObj;
};

// Format preview images for all stickers inside an order
export const formatOrderStickerImages = (order) => {
  const orderObj = order.toObject ? order.toObject() : order;

  if (orderObj.items?.length) {
    orderObj.items = orderObj.items.map(item => ({
      ...item,
      sticker_id: item.sticker_id
        ? formatStickerImages(item.sticker_id)
        : null
    }));
  }

  return orderObj;
};