    // 全局变量
        let images = []; // 存储上传的图片数据
        let currentStep = 1; // 当前步骤
        let attribute = ''; // 属性名称
        let ranking = []; // 排行榜数据
        let comparisons = []; // 待比较的对
        let currentComparison = null; // 当前正在比较的对
        
        // DOM 元素
        const steps = document.querySelectorAll('.step');
        const progressSteps = document.querySelectorAll('.progress-step');
        const progressLine = document.getElementById('progress-line');
        
        // 初始化应用
        document.addEventListener('DOMContentLoaded', function() {
            // 文件上传功能
            const uploadArea = document.getElementById('upload-area');
            const fileInput = document.getElementById('file-input');
            const selectFilesBtn = document.getElementById('select-files-btn');
            const imageList = document.getElementById('image-list');
            
            // 点击选择文件按钮
            selectFilesBtn.addEventListener('click', function() {
                fileInput.click();
            });
            
            // 文件选择变化
            fileInput.addEventListener('change', handleFileSelect);
            
            // 拖放功能
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', function() {
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length) {
                    handleFiles(e.dataTransfer.files);
                }
            });
            
            // 步骤导航
            document.getElementById('next-step1').addEventListener('click', function() {
                if (images.length < 2) {
                    alert('请至少上传两张图片');
                    return;
                }
                goToStep(2);
            });
            
            document.getElementById('prev-step2').addEventListener('click', function() {
                goToStep(1);
            });
            
            document.getElementById('next-step2').addEventListener('click', function() {
                attribute = document.getElementById('attribute-input').value.trim();
                if (!attribute) {
                    alert('请输入属性名称');
                    return;
                }
                
                // 更新比较界面中的属性名称
                document.getElementById('attribute-name').textContent = attribute;
                
                // 初始化比较排序
                initializeComparison();
                
                goToStep(3);
            });
            
            document.getElementById('prev-step3').addEventListener('click', function() {
                goToStep(2);
            });
            
            document.getElementById('prev-step4').addEventListener('click', function() {
                goToStep(3);
            });
            
            document.getElementById('next-step4').addEventListener('click', function() {
                generateRanking();
                goToStep(5);
            });
            
            document.getElementById('prev-step5').addEventListener('click', function() {
                goToStep(4);
            });
            
            document.getElementById('save-ranking').addEventListener('click', function() {
                saveRankingImage();
            });
            
            document.getElementById('restart').addEventListener('click', function() {
                if (confirm('确定要重新开始吗？当前数据将丢失。')) {
                    location.reload();
                }
            });
            
            // 步骤3的下一步按钮
            document.getElementById('next-step3').addEventListener('click', function() {
                goToStep(4);
            });
            
            // 模板选择
            const templateOptions = document.querySelectorAll('.template-option');
            templateOptions.forEach(option => {
                option.addEventListener('click', function() {
                    templateOptions.forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                    document.getElementById('template-select').value = this.dataset.template;
                });
            });
            
            // 初始化裁剪功能
            initializeCropper();
        });
        
        // 处理文件选择
        function handleFileSelect(e) {
            handleFiles(e.target.files);
        }
        
 // 全局变量
let cropModal = null;
let cropper = null;
let currentCropFile = null;
let currentCropIndex = 0;
let cropFiles = [];

// 修改后的 handleFiles 函数
function handleFiles(files) {
    cropFiles = [];
    
    // 将文件对象转换为数组
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 检查文件类型
        if (!file.type.match('image.*')) {
            continue;
        }
        
        cropFiles.push(file);
    }
    
    if (cropFiles.length === 0) return;
    
    // 初始化裁剪模态框
    initCropModal();
    
    // 开始裁剪第一个文件
    currentCropIndex = 0;
    startCrop(cropFiles[currentCropIndex]);
}

// 初始化裁剪模态框
function initCropModal() {
    // 如果模态框已存在，则移除
    if (cropModal) {
        cropModal.remove();
    }
    
    // 创建模态框
    cropModal = document.createElement('div');
    cropModal.id = 'crop-modal';
    cropModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    cropModal.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 20px; max-width: 90%; max-height: 90%; overflow: auto;">
            <h2 style="margin-bottom: 15px; color: #4a6fa5;">裁剪图片</h2>
            <p style="margin-bottom: 15px;">请将图片裁剪为正方形，然后点击确认</p>
            <div style="margin-bottom: 15px;">
                <img id="crop-image" style="max-width: 100%; max-height: 400px;">
            </div>
            <div class="btn-group">
                <button class="btn" id="crop-confirm">确认裁剪</button>
                <button class="btn btn-secondary" id="crop-skip">跳过此图片</button>
                <button class="btn btn-secondary" id="crop-cancel">取消全部</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cropModal);
    
    // 添加事件监听
    document.getElementById('crop-confirm').addEventListener('click', confirmCrop);
    document.getElementById('crop-skip').addEventListener('click', skipCrop);
    document.getElementById('crop-cancel').addEventListener('click', cancelCrop);
}

// 开始裁剪图片
function startCrop(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const image = document.getElementById('crop-image');
        image.src = e.target.result;
        
        // 销毁之前的 Cropper 实例
        if (cropper) {
            cropper.destroy();
        }
        
        // 初始化 Cropper
        cropper = new Cropper(image, {
            aspectRatio: 1, // 正方形
            viewMode: 1,
            autoCropArea: 1,
            movable: true,
            zoomable: true,
            rotatable: false,
            scalable: false,
            ready: function() {
                // 裁剪器准备就绪
            }
        });
        
        currentCropFile = file;
    };
    
    reader.readAsDataURL(file);
}

// 确认裁剪
function confirmCrop() {
    if (!cropper) return;
    
    // 获取裁剪后的图片数据
    const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300
    });
    
    const croppedDataURL = canvas.toDataURL('image/jpeg');
    
    // 创建图片数据对象
    const imageData = {
        id: Date.now() + currentCropIndex,
        name: `图片${images.length + 1}`,
        src: croppedDataURL,
        croppedSrc: croppedDataURL
    };
    
    // 添加到图片列表
    images.push(imageData);
    displayImage(imageData);
    
    // 处理下一个文件或关闭模态框
    nextCropOrClose();
}

// 跳过当前图片
function skipCrop() {
    // 处理下一个文件或关闭模态框
    nextCropOrClose();
}

// 取消全部裁剪
function cancelCrop() {
    if (cropModal) {
        cropModal.remove();
        cropModal = null;
    }
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    cropFiles = [];
    currentCropFile = null;
    currentCropIndex = 0;
}

// 处理下一个文件或关闭模态框
function nextCropOrClose() {
    currentCropIndex++;
    
    if (currentCropIndex < cropFiles.length) {
        // 处理下一个文件
        startCrop(cropFiles[currentCropIndex]);
    } else {
        // 所有文件处理完成，关闭模态框
        if (cropModal) {
            cropModal.remove();
            cropModal = null;
        }
        
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        
        cropFiles = [];
        currentCropFile = null;
        currentCropIndex = 0;
    }
}
        
        // 显示图片到列表
// 修改后的 displayImage 函数，添加编辑名称功能
function displayImage(imageData) {
    const imageList = document.getElementById('image-list');
    
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.dataset.id = imageData.id;
    
    const img = document.createElement('img');
    img.src = imageData.croppedSrc || imageData.src;
    img.alt = imageData.name;
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'name';
    nameSpan.textContent = imageData.name;
    
    const removeBtn = document.createElement('div');
    removeBtn.className = 'remove';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        images = images.filter(img => img.id !== imageData.id);
        imageItem.remove();
    });
    
    imageItem.appendChild(img);
    imageItem.appendChild(nameSpan);
    imageItem.appendChild(removeBtn);
    
    imageList.appendChild(imageItem);
    
    // 添加点击编辑名称功能
    nameSpan.addEventListener('click', function() {
        const newName = prompt('请输入新名称：', imageData.name);
        if (newName && newName.trim()) {
            imageData.name = newName.trim();
            nameSpan.textContent = newName.trim();
        }
    });
}
        
        // 初始化裁剪功能
        function initializeCropper() {
            // 这里简化了裁剪功能，实际应用中可以使用Cropper.js等库
            // 为简化演示，这里假设所有图片都是正方形或已处理好
        }
        
        // 初始化比较排序
        function initializeComparison() {
            // 初始化比较对
            comparisons = [];
            ranking = [...images];
            
            // 生成所有可能的比较对
            for (let i = 0; i < images.length; i++) {
                for (let j = i + 1; j < images.length; j++) {
                    comparisons.push([i, j]);
                }
            }
            
            // 随机打乱比较对顺序
            shuffleArray(comparisons);
            
            // 重置按钮状态
            document.getElementById('skip-comparison').style.display = 'inline-block';
            document.getElementById('next-step3').style.display = 'none';
            
            // 开始第一个比较
            nextComparison();
        }
        
        // 打乱数组
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        
        // 显示下一个比较
        function nextComparison() {
            if (comparisons.length === 0) {
                // 所有比较完成
                document.getElementById('comparison-container').innerHTML = '<p>所有比较已完成！</p>';
                document.getElementById('skip-comparison').style.display = 'none';
                document.getElementById('next-step3').style.display = 'inline-block';
                return;
            }
            
            currentComparison = comparisons.pop();
            const [index1, index2] = currentComparison;
            
            const comparisonContainer = document.getElementById('comparison-container');
            comparisonContainer.innerHTML = '';
            
            // 创建第一个比较项
            const item1 = document.createElement('div');
            item1.className = 'comparison-item';
            item1.dataset.index = index1;
            
            const img1 = document.createElement('img');
            img1.src = ranking[index1].src;
            img1.alt = ranking[index1].name;
            
            const name1 = document.createElement('div');
            name1.className = 'name';
            name1.textContent = ranking[index1].name;
            
            item1.appendChild(img1);
            item1.appendChild(name1);
            
            // 创建第二个比较项
            const item2 = document.createElement('div');
            item2.className = 'comparison-item';
            item2.dataset.index = index2;
            
            const img2 = document.createElement('img');
            img2.src = ranking[index2].src;
            img2.alt = ranking[index2].name;
            
            const name2 = document.createElement('div');
            name2.className = 'name';
            name2.textContent = ranking[index2].name;
            
            item2.appendChild(img2);
            item2.appendChild(name2);
            
            // 添加点击事件
            item1.addEventListener('click', function() {
                handleComparisonChoice(index1, index2);
            });
            
            item2.addEventListener('click', function() {
                handleComparisonChoice(index2, index1);
            });
            
            comparisonContainer.appendChild(item1);
            comparisonContainer.appendChild(item2);
            
            // 显示跳过按钮
            document.getElementById('skip-comparison').style.display = 'inline-block';
            document.getElementById('skip-comparison').onclick = function() {
                // 跳过剩余比较，使用当前排名
                comparisons = [];
                nextComparison();
            };
        }
        
        // 处理比较选择
        function handleComparisonChoice(winnerIndex, loserIndex) {
            // 交换位置，使胜者排在前面
            if (winnerIndex > loserIndex) {
                [ranking[loserIndex], ranking[winnerIndex]] = [ranking[winnerIndex], ranking[loserIndex]];
            }
            
            // 进行下一个比较
            nextComparison();
        }
        
        // 生成排行榜
        function generateRanking() {
            const canvas = document.getElementById('ranking-canvas');
            const ctx = canvas.getContext('2d');
            const template = document.getElementById('template-select').value;
            const rows = parseInt(document.getElementById('rows-input').value);
            
            // 清除画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 设置背景
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制标题
            ctx.fillStyle = '#343a40';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${attribute}排行榜`, canvas.width / 2, 60);
            
            // 根据模板类型绘制排行榜
            switch(template) {
                case 'equal':
                    drawEqualRanking(ctx, rows);
                    break;
                case 'pyramid':
                    drawPyramidRanking(ctx, rows);
                    break;
                case 'spindle':
                    drawSpindleRanking(ctx, rows);
                    break;
            }
        }
        
        // 绘制等分型排行榜
        function drawEqualRanking(ctx, rows) {
            const itemsPerRow = Math.ceil(ranking.length / rows);
            const itemWidth = 150;
            const itemHeight = 180;
            const startX = (800 - itemsPerRow * itemWidth) / 2;
            const startY = 100;
            
            let index = 0;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < itemsPerRow; col++) {
                    if (index >= ranking.length) break;
                    
                    const x = startX + col * itemWidth;
                    const y = startY + row * itemHeight;
                    
                    // 绘制图片
                    const img = new Image();
                    img.src = ranking[index].src;
                    img.onload = function() {
                        ctx.drawImage(img, x, y, 120, 120);
                    };
                    
                    // 绘制名称
                    ctx.fillStyle = '#343a40';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(ranking[index].name, x + 60, y + 150);
                    
                    // 绘制排名
                    ctx.fillStyle = '#4a6fa5';
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText(`第${index + 1}名`, x + 60, y + 170);
                    
                    index++;
                }
            }
        }
        
        // 绘制金字塔型排行榜
        function drawPyramidRanking(ctx, rows) {
            // 简化的金字塔型绘制
            const startY = 100;
            let index = 0;
            
            for (let row = 0; row < rows; row++) {
                const itemsInRow = row + 1;
                const itemWidth = 120;
                const totalWidth = itemsInRow * itemWidth;
                const startX = (800 - totalWidth) / 2;
                
                for (let col = 0; col < itemsInRow; col++) {
                    if (index >= ranking.length) break;
                    
                    const x = startX + col * itemWidth;
                    const y = startY + row * 180;
                    
                    // 绘制图片
                    const img = new Image();
                    img.src = ranking[index].src;
                    img.onload = function() {
                        ctx.drawImage(img, x, y, 100, 100);
                    };
                    
                    // 绘制名称
                    ctx.fillStyle = '#343a40';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(ranking[index].name, x + 50, y + 130);
                    
                    // 绘制排名
                    ctx.fillStyle = '#4a6fa5';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`第${index + 1}名`, x + 50, y + 150);
                    
                    index++;
                }
            }
        }
        
        // 绘制纺锤型排行榜
        function drawSpindleRanking(ctx, rows) {
            // 简化的纺锤型绘制
            const startY = 100;
            let index = 0;
            
            for (let row = 0; row < rows; row++) {
                let itemsInRow;
                if (row < Math.ceil(rows / 2)) {
                    itemsInRow = row + 1;
                } else {
                    itemsInRow = rows - row;
                }
                
                const itemWidth = 120;
                const totalWidth = itemsInRow * itemWidth;
                const startX = (800 - totalWidth) / 2;
                
                for (let col = 0; col < itemsInRow; col++) {
                    if (index >= ranking.length) break;
                    
                    const x = startX + col * itemWidth;
                    const y = startY + row * 180;
                    
                    // 绘制图片
                    const img = new Image();
                    img.src = ranking[index].src;
                    img.onload = function() {
                        ctx.drawImage(img, x, y, 100, 100);
                    };
                    
                    // 绘制名称
                    ctx.fillStyle = '#343a40';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(ranking[index].name, x + 50, y + 130);
                    
                    // 绘制排名
                    ctx.fillStyle = '#4a6fa5';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`第${index + 1}名`, x + 50, y + 150);
                    
                    index++;
                }
            }
        }
        
        // 保存排行榜图片
        function saveRankingImage() {
            const canvas = document.getElementById('ranking-canvas');
            const link = document.createElement('a');
            link.download = `${attribute}排行榜.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        // 跳转到指定步骤
        function goToStep(step) {
            // 隐藏所有步骤
            steps.forEach(s => s.classList.remove('active'));
            
            // 显示目标步骤
            document.getElementById(`step${step}`).classList.add('active');
            
            // 更新进度指示器
            progressSteps.forEach(ps => {
                const stepNum = parseInt(ps.dataset.step);
                if (stepNum < step) {
                    ps.classList.remove('active');
                    ps.classList.add('completed');
                } else if (stepNum === step) {
                    ps.classList.add('active');
                    ps.classList.remove('completed');
                } else {
                    ps.classList.remove('active', 'completed');
                }
            });
            
            // 更新进度条
            const progress = ((step - 1) / (progressSteps.length - 1)) * 100;
            progressLine.style.width = `${progress}%`;
            
            currentStep = step;
        }