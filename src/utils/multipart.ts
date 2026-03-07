// utils/MultipartProcessor.ts
import * as multipart from 'parse-multipart-data';

export interface MultipartFile {
  fieldname: string;
  filename: string;
  contentType: string;
  data: Buffer;
  size: number;
  encoding?: string;
}

export class MultipartProcessor {
  static parse(request: any): {
    fields: Record<string, any>;
    files: Record<string, MultipartFile | MultipartFile[]>;
  } {
    const { body, headers, isBase64Encoded } = request;

    if (!body) {
      return { fields: {}, files: {} };
    }

    let contentType = headers['content-type'] ?? headers['Content-Type'] ?? '';
    if (Array.isArray(contentType)) {
      contentType = contentType[0];
    }

    if (!contentType.startsWith('multipart/form-data')) {
      throw new Error('Not a multipart request');
    }

    const boundaryMatch = multipart.getBoundary(contentType);
    if (!boundaryMatch) {
      throw new Error('Invalid multipart boundary');
    }

    let bodyBuffer: Buffer;
    if (Buffer.isBuffer(body)) {
      bodyBuffer = body;
    } else if (typeof body === 'string') {
      bodyBuffer = isBase64Encoded ? Buffer.from(body, 'base64') : Buffer.from(body, 'binary');
    } else {
      bodyBuffer = Buffer.from(JSON.stringify(body));
    }

    const parts = multipart.parse(bodyBuffer, boundaryMatch);

    const fields: Record<string, any> = {};
    const files: Record<string, MultipartFile | MultipartFile[]> = {};

    parts.forEach((part: any) => {
      if (part.filename) {
        const fieldName = part.name || 'file';

        const fileData: MultipartFile = {
          fieldname: fieldName,
          filename: part.filename,
          contentType: part.type,
          data: part.data,
          size: part.data.length,
          encoding: part.encoding,
        };

        if (files[fieldName]) {
          if (Array.isArray(files[fieldName])) {
            (files[fieldName] as MultipartFile[]).push(fileData);
          } else {
            files[fieldName] = [files[fieldName] as MultipartFile, fileData];
          }
        } else {
          files[fieldName] = fileData;
        }
      } else if (part.name) {
        const text = part.data.toString('utf-8').trim();

        try {
          fields[part.name] = JSON.parse(text);
        } catch {
          fields[part.name] = text;
        }
      }
    });

    return { fields, files };
  }

  static isMultipart(request: any): boolean {
    const contentType =
      request.headers?.['content-type'] || request.headers?.['Content-Type'] || '';
    return contentType.startsWith('multipart/form-data');
  }
}
