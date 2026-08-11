/**
 * 图片上传前压缩（审计 P0：整图 base64 数百 KB，弱网体验差）
 * 目标：最长边缩到 1280px（约 1MP 内）+ JPEG 0.7。
 * 仅处理本地文件（file://），远程/未知 URI 原样返回。
 */
import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_EDGE = 1280;

export async function compressImage(uri: string): Promise<string> {
  if (!uri.startsWith('file://')) {
    return uri; // 远程/占位图不压缩
  }
  try {
    const { width, height } = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
      },
    );
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    
    const isLandscape = width >= height;
    const actions = scale < 1 
      ? [{ resize: isLandscape ? { width: Math.round(width * scale) } : { height: Math.round(height * scale) } }]
      : [];
      
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions as ImageManipulator.Action[],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    console.log(
      `[ImageCompress] ${width}x${height} -> ${result.width}x${result.height} (${Math.round(scale * 100)}%)`,
    );
    return result.uri;
  } catch (err) {
    console.warn('[ImageCompress] fallback to original:', err);
    return uri;
  }
}
