interface PropertyThumbProps {
  name?: string;
  image?: string;
  empty?: boolean;
}

export default function PropertyThumb({
  name,
  image,
  empty = false,
}: PropertyThumbProps) {
  if (empty) {
    return (
      <div className="aspect-square rounded-xl border-2 border-dashed border-pastel-200/50 bg-pastel-50/30" />
    );
  }

  return (
    <div className="aspect-square overflow-hidden rounded-xl border-2 border-pastel-200/70 bg-pastel-100/60 p-2.5 shadow-sm">
      <div className="flex h-full w-full items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={name}
            className="max-h-full max-w-full object-contain rounded-sm"
          />
        ) : (
          <span className="text-center text-xs font-medium text-pastel-500">
            {name}
          </span>
        )}
      </div>
    </div>
  );
}
