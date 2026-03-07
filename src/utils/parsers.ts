import multipart from 'parse-multipart-data';

export const ParseQuery = (url: URL) => {
  const params = url.searchParams;
  const query: Record<string, string | string[]> = {};

  for (const key of params.keys()) {
    const values = params.getAll(key);

    query[key] = values.length > 1 ? values : values[0];
  }

  return query;
};

export const ParseBody = (request: any) => {
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  const { body, headers, isBase64Encoded } = request;

  if (!body) {
    return {};
  }

  let contentType = headers['content-type'] ?? headers['Content-Type'] ?? '';
  if (Array.isArray(contentType)) {
    contentType = contentType[0];
  }

  if (!contentType.startsWith('multipart/form-data')) {
    try {
      if (typeof body === 'string') {
        const parsed = JSON.parse(body);
        return parsed;
      }

      if (Buffer.isBuffer(body)) {
        const parsed = JSON.parse(body.toString('utf8'));
        return parsed;
      }
      return body;
    } catch (_) {
      if (Buffer.isBuffer(body)) {
        return body.toString('utf8');
      }
      return body;
    }
  }

  const boundaryMatch = multipart.getBoundary(contentType);

  if (!body || !boundaryMatch) {
    return {
      status: 400,
      message: 'Invalid multipart request',
    };
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

  const parsedBody = parts.reduce((acc: any, part: any) => {
    if (part.filename) {
      acc.file = {
        filename: part.filename,
        contentType: part.type,
        data: part.data,
        size: part.data.length,
      };
    } else if (part.name) {
      const text = part.data.toString('utf-8').trim();
      try {
        acc[part.name] = JSON.parse(text);
      } catch {
        acc[part.name] = text;
      }
    }
    return acc;
  }, {});

  return parsedBody;
};
