se2412 logout
se2412 login --username admin --passw freepasses4all
se2412 healthcheck
se2412 resetpasses
se2412 healthcheck
se2412 resetstations
se2412 healthcheck
se2412 admin --addpasses --source ../back-end/data/passes12.csv
se2412 healthcheck
se2412 tollstationpasses --station AM08 --from 20220203 --to 20220217 --format json
se2412 tollstationpasses --station NAO04 --from 20220203 --to 20220217 --format csv
se2412 tollstationpasses --station NO01 --from 20220203 --to 20220217 --format csv
se2412 tollstationpasses --station OO03 --from 20220203 --to 20220217 --format csv
se2412 tollstationpasses --station XXX --from 20220203 --to 20220217 --format csv
se2412 tollstationpasses --station OO03 --from 20220203 --to 20220217 --format YYY
se2412 errorparam --station OO03 --from 20220203 --to 20220217 --format csv
se2412 tollstationpasses --station AM08 --from 20220204 --to 20220215 --format json
se2412 tollstationpasses --station NAO04 --from 20220204 --to 20220215 --format csv
se2412 tollstationpasses --station NO01 --from 20220204 --to 20220215 --format csv
se2412 tollstationpasses --station OO03 --from 20220204 --to 20220215 --format csv
se2412 tollstationpasses --station XXX --from 20220204 --to 20220215 --format csv
se2412 tollstationpasses --station OO03 --from 20220204 --to 20220215 --format YYY
se2412 passanalysis --stationop AM --tagop NAO --from 20220203 --to 20220217 --format json
se2412 passanalysis --stationop NAO --tagop AM --from 20220203 --to 20220217 --format csv
se2412 passanalysis --stationop NO --tagop OO --from 20220203 --to 20220217 --format csv
se2412 passanalysis --stationop OO --tagop KO --from 20220203 --to 20220217 --format csv
se2412 passanalysis --stationop XXX --tagop KO --from 20220203 --to 20220217 --format csv
se2412 passanalysis --stationop AM --tagop NAO --from 20220204 --to 20220215 --format json
se2412 passanalysis --stationop NAO --tagop AM --from 20220204 --to 20220215 --format csv
se2412 passanalysis --stationop NO --tagop OO --from 20220204 --to 20220215 --format csv
se2412 passanalysis --stationop OO --tagop KO --from 20220204 --to 20220215 --format csv
se2412 passanalysis --stationop XXX --tagop KO --from 20220204 --to 20220215 --format csv
se2412 passescost --stationop AM --tagop NAO --from 20220203 --to 20220217 --format json
se2412 passescost --stationop NAO --tagop AM --from 20220203 --to 20220217 --format csv
se2412 passescost --stationop NO --tagop OO --from 20220203 --to 20220217 --format csv
se2412 passescost --stationop OO --tagop KO --from 20220203 --to 20220217 --format csv
se2412 passescost --stationop XXX --tagop KO --from 20220203 --to 20220217 --format csv
se2412 passescost --stationop AM --tagop NAO --from 20220204 --to 20220215 --format json
se2412 passescost --stationop NAO --tagop AM --from 20220204 --to 20220215 --format csv
se2412 passescost --stationop NO --tagop OO --from 20220204 --to 20220215 --format csv
se2412 passescost --stationop OO --tagop KO --from 20220204 --to 20220215 --format csv
se2412 passescost --stationop XXX --tagop KO --from 20220204 --to 20220215 --format csv
se2412 chargesby --opid NAO --from 20220203 --to 20220217 --format json
se2412 chargesby --opid GE --from 20220203 --to 20220217 --format csv
se2412 chargesby --opid OO --from 20220203 --to 20220217 --format csv
se2412 chargesby --opid KO --from 20220203 --to 20220217 --format csv
se2412 chargesby --opid NO --from 20220203 --to 20220217 --format csv
se2412 chargesby --opid NAO --from 20220204 --to 20220215 --format json
se2412 chargesby --opid GE --from 20220204 --to 20220215 --format csv
se2412 chargesby --opid OO --from 20220204 --to 20220215 --format csv
se2412 chargesby --opid KO --from 20220204 --to 20220215 --format csv
se2412 chargesby --opid NO --from 20220204 --to 20220215 --format csv