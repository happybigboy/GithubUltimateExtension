# GithubUltimateExtension 🚀

GithubUltimateExtension is a powerful browser extension designed to enhance your GitHub experience. It provides various features to help you manage repositories, pull requests, issues, and more, all from a convenient interface.

## Features ✨

- **Dark Mode** 🌙: Toggle between light and dark themes for a comfortable viewing experience.
- **Repository Management** 📂: View and filter your repositories by name, language, or owner.
- **Pull Requests** 🔄: Fetch and display all your open pull requests with detailed information.
- **Issues** 🐛: View assigned issues and recommended issues based on your repository languages.
- **GitHub Stars** ⭐: Track and display your starred repositories.
- **Codespaces** 💻: Easily access and manage your GitHub Codespaces.

## Installation 🛠️

### Option 1: Download from Releases

1. Download the latest version of the extension from the [releases page](https://github.com/happybigboy/GithubUltimateExtension/releases/tag/v2.0).
2. Extract the `extension.zip` file to a directory of your choice.
3. Load the extension in your browser:
    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" in the top right corner
    - Click "Load unpacked" and select the extracted directory

### Option 2: Manual Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/happybigboy/GithubUltimateExtension.git
    ```
2. Navigate to the project directory:
    ```sh
    cd GithubUltimateExtension
    ```
3. Load the extension in your browser:
    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" in the top right corner
    - Click "Load unpacked" and select the project directory

## Usage 📖

1. Open the extension by clicking on the extension icon in the browser toolbar.
2. Navigate through the tabs to access different features:
    - **Repositories**: View and filter your repositories.
    - **Pull Requests**: View your open pull requests.
    - **Issues**: View assigned issues and recommended issues.
    - **Stars**: View your starred repositories.
3. Use the floating menu to quickly refresh data or toggle dark mode.

## Contributing 🤝

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:
    ```sh
    git checkout -b feature/your-feature-name
    ```
3. Make your changes and commit them:
    ```sh
    git commit -m 'Add some feature'
    ```
4. Push to the branch:
    ```sh
    git push origin feature/your-feature-name
    ```
5. Open a pull request.

## License 📄

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements 🙏

- [Tailwind CSS](https://tailwindcss.com/) for the styling framework.
- [GitHub API](https://docs.github.com/en/rest) for providing the data.

## Contact 📬

For any questions or feedback, please open an issue or contact the repository owner.

## Optimization Tips 🛠️

1. **Optimize API Calls**:
   - Ensure that API calls are minimized and batched where possible. For example, in [`repoUtils.js`](utils/repos/repoUtils.js), functions like [`fetchRepos`](utils/repos/repoUtils.js) and [`fetchAllRepos`](utils/repos/repoUtils.js) should be optimized to reduce redundant calls.

2. **Caching**:
   - Implement caching strategies to store frequently accessed data. This is partially done in [`token.js`](utils/token.js), but ensure all API responses that don't change frequently are cached.

3. **Lazy Loading**:
   - Load resources only when needed. For example, defer loading of images and other assets until they are in the viewport.

4. **Code Splitting**:
   - Split your JavaScript code into smaller chunks that can be loaded on demand. This can be done using dynamic imports.

5. **UI/UX Improvements**:
   - Enhance the user interface for better usability. Ensure that elements like accordions in [`index.html`](index.html) and [`settings.html`](settings.html) are responsive and provide a smooth user experience.

6. **Service Worker Optimization**:
   - Optimize the service worker in [`background.js`](background.js) to handle background tasks efficiently without blocking the main thread.

7. **CSS Optimization**:
   - Minimize and optimize CSS. Ensure that only the necessary styles are included and consider using a CSS preprocessor like Tailwind CSS, which you are already using ([`tailwind.config.js`](tailwind.config.js)).

8. **Performance Monitoring**:
   - Implement performance monitoring to identify and address bottlenecks. Use tools like Lighthouse to audit your extension's performance.