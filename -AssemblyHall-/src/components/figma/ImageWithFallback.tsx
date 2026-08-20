import { useState, type ImgHTMLAttributes } from "react"

type Props = ImgHTMLAttributes<HTMLImageElement>

export function ImageWithFallback({ src, alt, ...props }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return (
      <div
        style={{ background: "#E2D9C4", display: "flex", alignItems: "center", justifyContent: "center", ...props.style }}
        className={props.className}
        aria-label={alt}
      />
    )
  }
  return <img src={src} alt={alt} {...props} onError={() => setFailed(true)} />
}
