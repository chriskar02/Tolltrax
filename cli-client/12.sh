node se2412.js logout
node se2412.js login --username admin --passw freepasses4all
node se2412.js healthcheck
node se2412.js resetpasses
node se2412.js healthcheck
node se2412.js resetstations
node se2412.js healthcheck
node se2412.js admin --addpasses --source ../back-end/data/passes12.csv
node se2412.js healthcheck
node se2412.js tollstationpasses --station AM08 --from 20220203 --to 20220217 --format json
node se2412.js tollstationpasses --station NAO04 --from 20220203 --to 20220217 --format csv
node se2412.js tollstationpasses --station NO01 --from 20220203 --to 20220217 --format csv
node se2412.js tollstationpasses --station OO03 --from 20220203 --to 20220217 --format csv
node se2412.js tollstationpasses --station XXX --from 20220203 --to 20220217 --format csv
node se2412.js tollstationpasses --station OO03 --from 20220203 --to 20220217 --format YYY
node se2412.js errorparam --station OO03 --from 20220203 --to 20220217 --format csv
node se2412.js tollstationpasses --station AM08 --from 20220204 --to 20220215 --format json
node se2412.js tollstationpasses --station NAO04 --from 20220204 --to 20220215 --format csv
node se2412.js tollstationpasses --station NO01 --from 20220204 --to 20220215 --format csv
node se2412.js tollstationpasses --station OO03 --from 20220204 --to 20220215 --format csv
node se2412.js tollstationpasses --station XXX --from 20220204 --to 20220215 --format csv
node se2412.js tollstationpasses --station OO03 --from 20220204 --to 20220215 --format YYY
node se2412.js passanalysis --stationop AM --tagop NAO --from 20220203 --to 20220217 --format json
node se2412.js passanalysis --stationop NAO --tagop AM --from 20220203 --to 20220217 --format csv
node se2412.js passanalysis --stationop NO --tagop OO --from 20220203 --to 20220217 --format csv
node se2412.js passanalysis --stationop OO --tagop KO --from 20220203 --to 20220217 --format csv
node se2412.js passanalysis --stationop XXX --tagop KO --from 20220203 --to 20220217 --format csv
node se2412.js passanalysis --stationop AM --tagop NAO --from 20220204 --to 20220215 --format json
node se2412.js passanalysis --stationop NAO --tagop AM --from 20220204 --to 20220215 --format csv
node se2412.js passanalysis --stationop NO --tagop OO --from 20220204 --to 20220215 --format csv
node se2412.js passanalysis --stationop OO --tagop KO --from 20220204 --to 20220215 --format csv
node se2412.js passanalysis --stationop XXX --tagop KO --from 20220204 --to 20220215 --format csv
node se2412.js passescost --stationop AM --tagop NAO --from 20220203 --to 20220217 --format json
node se2412.js passescost --stationop NAO --tagop AM --from 20220203 --to 20220217 --format csv
node se2412.js passescost --stationop NO --tagop OO --from 20220203 --to 20220217 --format csv
node se2412.js passescost --stationop OO --tagop KO --from 20220203 --to 20220217 --format csv
node se2412.js passescost --stationop XXX --tagop KO --from 20220203 --to 20220217 --format csv
node se2412.js passescost --stationop AM --tagop NAO --from 20220204 --to 20220215 --format json
node se2412.js passescost --stationop NAO --tagop AM --from 20220204 --to 20220215 --format csv
node se2412.js passescost --stationop NO --tagop OO --from 20220204 --to 20220215 --format csv
node se2412.js passescost --stationop OO --tagop KO --from 20220204 --to 20220215 --format csv
node se2412.js passescost --stationop XXX --tagop KO --from 20220204 --to 20220215 --format csv
node se2412.js chargesby --opid NAO --from 20220203 --to 20220217 --format json
node se2412.js chargesby --opid GE --from 20220203 --to 20220217 --format csv
node se2412.js chargesby --opid OO --from 20220203 --to 20220217 --format csv
node se2412.js chargesby --opid KO --from 20220203 --to 20220217 --format csv
node se2412.js chargesby --opid NO --from 20220203 --to 20220217 --format csv
node se2412.js chargesby --opid NAO --from 20220204 --to 20220215 --format json
node se2412.js chargesby --opid GE --from 20220204 --to 20220215 --format csv
node se2412.js chargesby --opid OO --from 20220204 --to 20220215 --format csv
node se2412.js chargesby --opid KO --from 20220204 --to 20220215 --format csv
node se2412.js chargesby --opid NO --from 20220204 --to 20220215 --format csv