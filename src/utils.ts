export function humanize(num: number): string {
  if (num >= 1e6) {
    return `${(num / 1e6).toPrecision(3)}M`
  } else if (num >= 1e3) {
    return `${(num / 1e3).toPrecision(3)}k`
  } else {
    return `${num}`
  }
}

export function titleCase(s: string): string {
  return s.split(/[_ ]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function unsnake(s: string): string {
  return s.replace('_', ' ')
}

