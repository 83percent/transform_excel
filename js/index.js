const __AREA__ = {
    30 : '서울',
    40 : '경기',
    50 : '충북',
    51 : '충남',
    60 : '경북',
    61 : '경남',
    70 : '전북',
    71 : '전남',
    80 : '강원',
    90 : '기타'
}
const app = new Vue({
    el: '#app',
    data: {
        group_main : [],
        group_etc : []
    },
    methods: {
        upload: function(e) {
            const transformDate = (dateArray) => dateArray.map(e => e.split("/")[1]+"일").join(" ");
            const input = e.target;
            const reader = new FileReader();
            let result = [];
            let etc = [];
            reader.onload = function() {
                const fileData = reader.result;
                const wb = XLSX.read(fileData, {type : 'binary'});
                wb.SheetNames.forEach(function(sheetName){
                    const rowdata =XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {raw: false, dateNF: 'YYYY-MM-DD'});
                    let sortData = rowdata.reduce((acc, line) => {
                        let s = [];
                        for(let i=1; i<=4; i++) {
                            const temp = line[`제${i}휴무일`];
                            if(temp) s.push(temp);
                            else break;
                        }
                        s = transformDate(s);
                        if(s.length > 0) {
                            if(!acc[s]) acc[s] = [line];
                            else acc[s].push(line);
                        }
                        return acc;
                    }, {});

                    // 정렬 데이터 그룹핑
                    Object.entries(sortData).forEach((data) => {
                        const date = data.shift();
                        if(data[0].length > 5) {
                            // 휴무일 날짜로 집계
                            let temp = data[0].reduce((newRow, row) => {
                                if(!newRow[row["지역"]]) newRow[row["지역"]] = [];
                                newRow[row["지역"]].push(row["점포명"]);
                                return newRow;
                            }, {});
                            temp = Object.entries(temp).sort((a,b) => {
                                return a[0] - b[0]
                            }).map(e => {
                                return {
                                    area: __AREA__[e[0]],
                                    list: e[1]
                                }
                            });
                            result.push({
                                title : date,
                                group : temp
                            });
                        } else {
                            // 기타 휴무일
                            etc.push({
                                title : date,
                                data : data[0].map(e => e["점포명"])
                            });
                        }
                    }) // / 정렬 데이터 그룹핑
                    
                    this.group_main = result;
                    this.group_etc = etc;
                    console.log(this.group_main)
                });
            };
            reader.readAsBinaryString(input.files[0]);
        }, // upload
        exportSheet : function() {
            if(this.group_main.length === 0) return window.alert("변환하려는 파일을 먼저 업로드 해주세요.")
            const main = XLSX.utils.json_to_sheet(this.group_main);
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, main, "jaehoon");

            XLSX.writeFile(wb, 'test.xlsx');
        }
    }
})