(() => {
    'use strict';
    const project = 'https://sxeslpgevuzabvetfijl.supabase.co';
    const publicKey = 'sb_publishable_6zZxDufl8qJ_C1Yk3-1PmQ_a2HzU-M8';
    const list = document.getElementById('recordsList');
    const status = document.getElementById('recordsStatus');
    const retry = document.getElementById('recordsRetry');
    const labels = { seen: 'Vẫn thấy', helped: 'Đã được giúp đỡ', not_found: 'Không còn ở đây', other: 'Khác', unknown: 'Chưa cập nhật' };
    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function photoUrl(value) {
        if (typeof value !== 'string' || !value.trim()) return null;
        const image = value.trim();
        if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z\d+/=\s]+$/i.test(image)) return image;
        try {
            const url = new URL(image);
            return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
        } catch {
            if (image.includes(':') || image.startsWith('//') || image.split('/').some(part => part === '..')) return null;
            return `${project}/storage/v1/object/public/cat-images/${image.split('/').map(encodeURIComponent).join('/')}`;
        }
    }
    function directionsUrl(cat) {
        if ([cat.lat, cat.lng].some(value => !['number', 'string'].includes(typeof value) || String(value).trim() === '')) return null;
        const lat = Number(cat.lat), lng = Number(cat.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
        const url = new URL('https://www.google.com/maps/dir/');
        url.search = new URLSearchParams({ api: '1', destination: `${lat},${lng}` }).toString();
        return url.href;
    }
    function externalLink(text, href) {
        const link = element('a', text);
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        return link;
    }
    function card(cat) {
        const name = cat.name || 'Mèo chưa đặt tên';
        const article = element('article', undefined, 'record');
        const image = photoUrl(cat.image);
        if (image) {
            const photo = element('img');
            photo.src = image;
            photo.alt = `Ảnh ghi nhận: ${name}`;
            photo.loading = 'lazy';
            photo.referrerPolicy = 'no-referrer';
            photo.addEventListener('error', () => { photo.remove(); }, { once: true });
            article.append(photo);
        }
        article.append(element('h2', name), element('p', cat.location_name || 'Chưa xác định địa điểm'), element('p', `Tình trạng: ${labels[cat.current_status] || labels.unknown}`));
        if (cat.status_updated_at) {
            const date = new Date(cat.status_updated_at);
            if (Number.isFinite(date.getTime())) article.append(element('p', `Cập nhật tình trạng: ${date.toLocaleString('vi-VN')}`, 'muted'));
        }
        if (cat.note) article.append(element('p', String(cat.note).slice(0, 2000)));
        const actions = element('div', undefined, 'record-actions');
        const directions = directionsUrl(cat);
        if (directions) actions.append(externalLink('Chỉ đường trên Google Maps ↗', directions));
        const report = new URL('/lien-he.html', location.origin);
        report.search = new URLSearchParams({ cat: String(cat.id), ten: String(name).slice(0, 40) }).toString();
        const reportLink = element('a', 'Báo thông tin sai');
        reportLink.href = report.href;
        actions.append(reportLink);
        article.append(actions);
        return article;
    }
    async function load() {
        retry.hidden = true;
        list.replaceChildren();
        status.textContent = 'Đang tải các ghi nhận công khai…';
        try {
            const url = new URL('/rest/v1/cats', project);
            url.search = new URLSearchParams({
                select: 'id,name,location_name,note,image,current_status,status_updated_at,lat,lng',
                order: 'updated_at.desc', limit: '12'
            }).toString();
            const response = await fetch(url, { headers: { apikey: publicKey }, signal: AbortSignal.timeout(15000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const cats = await response.json();
            if (!Array.isArray(cats)) throw new Error('Dữ liệu không hợp lệ');
            const records = cats.filter(cat => cat && typeof cat === 'object' && cat.id != null).slice(0, 12);
            list.replaceChildren(...records.map(card));
            status.textContent = records.length ? `Đang hiển thị ${records.length} ghi nhận mới cập nhật.` : 'Chưa có ghi nhận công khai. Bạn có thể mở bản đồ để đóng góp lần gặp mèo đầu tiên.';
        } catch {
            status.textContent = 'Chưa tải được dữ liệu. Bạn có thể thử lại hoặc mở bản đồ để xem các ghi nhận.';
            retry.hidden = false;
        }
    }
    retry.addEventListener('click', load);
    load();
})();
