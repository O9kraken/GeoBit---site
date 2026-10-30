(function () {
        try {
            var KEY = 'adelf-theme';
            var saved = localStorage.getItem(KEY);
            var theme;
            if (saved === 'light' || saved === 'dark') {
                theme = saved;                      // повторный визит — сохранённый выбор
            } else {
                theme = (window.matchMedia &&
                         window.matchMedia('(prefers-color-scheme: light)').matches)
                        ? 'light' : 'dark';         // первый визит — системная тема
            }
            document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    })();
