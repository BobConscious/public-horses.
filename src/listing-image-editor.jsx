import { useEffect, useRef, useState } from 'react';
import { listingImageAltLimit, listingImageLimit, listingImageTypes } from '../shared/listing-image.js';
import { ErrorNotice, useLoad } from './ui.jsx';
import './workspace-images.css';

export function usePrivateListingImage(image) {
  return useLoad(image ? image.url.slice('/api'.length) : null);
}

export function useListingImage(image) {
  const stored = usePrivateListingImage(image);
  const [replacement, setReplacement] = useState(undefined);
  const [alt, setAlt] = useState(image?.alt ?? '');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState(null);
  const reader = useRef(null);

  useEffect(() => () => { reader.current?.abort(); }, []);

  function choose(event) {
    const input = event.currentTarget;
    const file = input.files[0];
    if (!file) return;
    reader.current?.abort();
    reader.current = null;
    if (!listingImageTypes.includes(file.type) || !file.size || file.size > listingImageLimit) {
      input.value = '';
      setReading(false);
      setError('Choose a JPEG, PNG, or WebP image up to 2 MB.');
      return;
    }

    const next = new FileReader();
    reader.current = next;
    setReading(true);
    setError(null);
    next.onload = () => {
      if (reader.current !== next) return;
      setReplacement(next.result);
      setReading(false);
    };
    next.onerror = () => {
      if (reader.current !== next) return;
      input.value = '';
      setReading(false);
      setError('The image could not load. Choose it again or select another file.');
    };
    next.readAsDataURL(file);
  }

  function remove() {
    setReplacement(image ? null : undefined);
    setAlt('');
    setError(null);
  }

  const hasImage = replacement === undefined ? Boolean(image) : Boolean(replacement);
  const dataUrl = replacement === undefined ? stored.data?.dataUrl : replacement;
  function imagePayload() {
    const description = alt.trim();
    if (replacement === undefined) {
      return image && description !== image.alt ? { alt: description } : undefined;
    }
    if (replacement === null) return null;
    return { data: replacement.slice(replacement.indexOf(',') + 1), alt: description };
  }

  return {
    alt, setAlt, hasImage, dataUrl, choose, remove, reading, error, imagePayload,
    stored: replacement === undefined && image ? stored : null,
  };
}

function ImagePreviewStatus({ state }) {
  if (!state.error) return <p className="field-hint" role="status">Loading image…</p>;
  return (
    <div>
      <ErrorNotice error={state.error} />
      <button type="button" className="button button-outline" onClick={state.reload}>Retry image preview</button>
    </div>
  );
}

export function ListingImageEditor({ editor, pending }) {
  const { alt, setAlt, hasImage, dataUrl, reading, error, choose, remove, stored } = editor;
  const fileInput = useRef(null);

  function removeImage() {
    remove();
    fileInput.current.value = '';
    fileInput.current.focus();
  }

  return (
    <fieldset className="listing-image-editor" disabled={pending}>
      <legend>Project image <span className="optional">Optional</span></legend>
      <label>
        {hasImage ? 'Replace image' : 'Choose an image'}
        <input ref={fileInput} type="file" accept={listingImageTypes.join(',')} aria-describedby="listing-image-hint" onChange={choose} />
      </label>
      <p className="field-hint" id="listing-image-hint">JPEG, PNG, or WebP. Up to 2 MB.</p>
      {reading && <p className="field-hint" role="status">Reading image…</p>}
      <ErrorNotice error={error} />
      {hasImage && (
        <>
          {dataUrl ? <img className="workspace-listing-image" src={dataUrl} alt={alt} />
            : stored && <ImagePreviewStatus state={stored} />}
          <div>
            <label>
              Image description
              <input required maxLength={listingImageAltLimit} value={alt} onChange={(event) => setAlt(event.target.value)}
                aria-describedby="listing-image-description-hint" />
            </label>
            <p className="field-hint" id="listing-image-description-hint">Describe what the image shows.</p>
          </div>
          <button type="button" className="button button-plain remove-listing-image" disabled={reading} onClick={removeImage}>Remove image</button>
        </>
      )}
    </fieldset>
  );
}

export function ReviewListingImage({ image, preview }) {
  return (
    <section className="review-listing-image" aria-label="Submitted image">
      {preview.data?.dataUrl ? (
        <figure>
          <img className="workspace-listing-image" src={preview.data.dataUrl} alt="" />
          <figcaption>{image.alt}</figcaption>
        </figure>
      ) : <ImagePreviewStatus state={preview} />}
    </section>
  );
}
