(() => {
    'use strict';
    const form = document.getElementById('reportForm');
    const type = document.getElementById('reportType');
    const catId = document.getElementById('reportCatId');
    const catName = document.getElementById('reportCatName');
    const details = document.getElementById('reportDetails');
    const draft = document.getElementById('reportDraft');
    const params = new URLSearchParams(location.search);
    catId.value = (params.get('cat') || '').slice(0, 200);
    catName.value = (params.get('ten') || '').slice(0, 40);
    if ([...type.options].some(option => option.value === params.get('loai'))) type.value = params.get('loai');

    function updateMode() {
        const privateRequest = type.value === 'du-lieu';
        for (const field of [catId, catName, details]) field.disabled = privateRequest;
        details.required = !privateRequest;
        document.getElementById('privateRequestNote').hidden = !privateRequest;
        draft.hidden = true;
    }
    updateMode();
    type.addEventListener('change', updateMode);
    form.addEventListener('input', () => { draft.hidden = true; });
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const privateRequest = type.value === 'du-lieu';
        const category = type.selectedOptions[0].textContent;
        const title = privateRequest ? 'Đề nghị bố trí kênh trao đổi riêng về dữ liệu tài khoản' : `[Báo cáo] ${category}`;
        const body = privateRequest
            ? 'Tôi muốn trao đổi riêng với người quản lý về dữ liệu tài khoản. Xin hướng dẫn một kênh liên hệ riêng để xác minh và xử lý yêu cầu.\n\nTôi không đưa email, thông tin tài khoản hay giấy tờ cá nhân vào issue công khai này.'
            : [
                `Loại yêu cầu: ${category}`,
                catId.value.trim() ? `Mã ghi nhận: ${catId.value.trim()}` : '',
                catName.value.trim() ? `Tên bé mèo: ${catName.value.trim()}` : '',
                `Thông tin cần kiểm tra:\n${details.value.trim()}`,
                'Bản đồ: https://phamduyen6611-ops.github.io/so-tay-bat-meo/'
            ].filter(Boolean).join('\n\n');
        const url = new URL('https://github.com/phamduyen6611-ops/so-tay-bat-meo/issues/new');
        url.search = new URLSearchParams({ title, body }).toString();
        document.getElementById('reportPreview').textContent = `${title}\n\n${body}`;
        document.getElementById('reportGithubLink').href = url.href;
        draft.hidden = false;
        draft.scrollIntoView({ block: 'nearest' });
    });
})();
