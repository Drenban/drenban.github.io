async function generateHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

generateHash('').then(hash => console.log(hash));
generateHash('').then(hash => console.log(hash));

t && (
    r.isFirefox || r.isChrome
        ? t.log.apply(t, [
            "\n" + (
                e
                    ? atob("JWMgQ3JlYXRlZCBieSBQZWVrWCAlYyBodHRwczovL3d3dy5wZWVreC5jb20vIA==")
                    : atob("JWMgRGV2ZWxvcGVkIGJ5IFBlZWtYICVjIGh0dHBzOi8vd3d3LnBlZWt4LmNvbS8g")
            ) + "\n",
            atob("Y29sb3I6ICNmZmY7IGJhY2tncm91bmQ6ICMyMjI7IHBhZGRpbmc6NXB4IDVweDs="),
            atob("Y29sb3I6ICM5OTk7IGJhY2tncm91bmQ6ICNGQ0ZDRkM7IHBhZGRpbmc6NXB4IDA7")
        ])
        : t.log(
            atob(e
                ? "Q3JlYXRlZCBieSBQZWVrWCAtIGh0dHBzOi8vd3d3LnBlZWt4LmNvbS8="
                : "RGV2ZWxvcGVkIGJ5IFBlZWtYIC0gaHR0cHM6Ly93d3cucGVla3guY29tLw=="
            )
        )
)
