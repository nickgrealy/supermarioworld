


const init = () => {
    // set initial positions
    const world = initialiseWorld()

    const player = world.player

    world.start()

    const CAPTURE_INPUT = [
        'ArrowLeft', 'ArrowRight', 'Space'
    ]

    const isKeyDown = {}
    const applyAction = (e, isKeyDown) => {
        e.preventDefault()
        e.stopPropagation()
        if (isKeyDown.ArrowRight) player.goRight()
        else if (isKeyDown.ArrowLeft) player.goLeft()
        else player.stop()
        // no double jump...
        if (isKeyDown.Space) player.jump()
    }
    // add key listeners
    document.addEventListener('keydown', (e) => {
        if (~CAPTURE_INPUT.indexOf(e.code)) {
            isKeyDown[e.code] = true
            applyAction(e, isKeyDown)
        } else {
            console.log(`Unhandled keypress - ${e.code}`)
        }
    });
    document.addEventListener('keyup', e => {
        if (~CAPTURE_INPUT.indexOf(e.code)) {
            isKeyDown[e.code] = false
            applyAction(e, isKeyDown)
        } else {
            console.log(`Unhandled keypress - ${e.code}`)
        }
    })
    // add controls listeners
    document.querySelector('jump').addEventListener('mousedown', e => {
        isKeyDown.Space = true
        applyAction(e, isKeyDown)
    })
    document.querySelector('jump').addEventListener('mouseup', e => {
        isKeyDown.Space = false
        applyAction(e, isKeyDown)
    })
    document.querySelector('moveleft').addEventListener('mousedown', e => {
        isKeyDown.ArrowLeft = true
        applyAction(e, isKeyDown)
    })
    document.querySelector('moveleft').addEventListener('mouseup', e => {
        isKeyDown.ArrowLeft = false
        applyAction(e, isKeyDown)
    })
    document.querySelector('moveright').addEventListener('mousedown', e => {
        isKeyDown.ArrowRight = true
        applyAction(e, isKeyDown)
    })
    document.querySelector('moveright').addEventListener('mouseup', e => {
        isKeyDown.ArrowRight = false
        applyAction(e, isKeyDown)
    })
}

document.addEventListener("DOMContentLoaded", init)

// functions

const initialiseWorld = () => {

    const GRAVITY_PXPERSEC = 80
    const ACCEL_PXPERSEC = 30
    const DECCEL_PXPERSEC = 40
    const MAX_VELOCITY = 15
    const FPS = parseInt(1000 / 45) // 60 fps

    const world = {
        player: null,
        platforms: []
    }

    document.querySelectorAll('world player,world platform').forEach(p => {
        // set positions...
        if (p.hasAttribute('xywh')) {
            const [x, y, w, h] = p.getAttribute('xywh').split(',').map(x => parseInt(x))
            p.xywh = { x, y, w, h }
            p.style.left = x + 'px'
            p.style.top = y + 'px'
            p.style.width = w + 'px'
            p.style.height = h + 'px'
        }

        if (p.tagName === 'PLAYER') {
            world.player = p
            p.vx = 0
            p.vy = 0
            p.dirx = 0
            p.action = 'standing'
            p.setAttribute('dir', 'right')
        } else if (p.tagName === 'PLATFORM') {
            world.platforms.push(p)
        }
    })

    // player
    
    const p = world.player
    // console.log(`direction: "${p.dir}"`)
    // functions to translate X/Y positions by...
    p.y = px => {
        p.xywh.y = p.xywh.y - px
        return p.xywh.y
    }
    p.x = px => {
        p.xywh.x = p.xywh.x + px
        return p.xywh.x
    }
    p.setY = y => {
        p.xywh.y = y
    }
    p.setX = x => {
        p.xywh.x = x
    }
    p.goLeft = () => {
        p.dirx = -1
    }
    p.goRight = () => {
        p.dirx = 1
    }
    p.stop = () => {
        p.dirx = 0
    }
    p.jump = () => {
        if (p.vy === 0) p.vy = 30
    }
    p.render = deltams => {
        // apply accel left and right...
        if (p.dirx === 0) {
            // grind to zero if not moving...
            if (Math.abs(p.vx) < 0.5) {
                p.vx = 0
                p.action = 'standing'
            }
            else if (p.vy === 0) { // not falling...
                p.vx += DECCEL_PXPERSEC * deltams / 1000 * (p.vx > 0 ? -1 : 1) // deccel in opposite direction
                p.action = Math.abs(p.vx) > 6 ? 'stopping' : 'standing'
            }
        } else {
            p.vx += ACCEL_PXPERSEC * deltams / 1000 * p.dirx
            p.action = 'running'
            if (Math.abs(p.vx) > MAX_VELOCITY) {
                p.vx = MAX_VELOCITY * p.dirx
            }
        }
        p.x(p.vx)
        // apply gravity...
        p.vy -= GRAVITY_PXPERSEC * deltams / 1000
        p.y(p.vy)
        // stop gravity, if you intercept a platform...
        const p2 = p.xywh
        const collision = world.platforms.find(({xywh: p1}) => {
            return (p2.x + p2.w) > p1.x 
                && (p2.y + p2.h) > p1.y 
                && p2.x < (p1.x + p1.w)
                // todo underneath platforms
        })
        if (collision) {
            // put character on top of platform
            p2.y = collision.xywh.y - p2.h
            // stop vertical acceleration
            p.vy = 0
        }
        if (p.vy !== 0) p.action = 'jumping' // or falling

        // stop player from going left past the start...
        if (p.xywh.x < 0) {
            p.xywh.x = 0
            p.vx = 0
        }

        // todo only update if changed... (the actual html changes)
        p.style.top = p.xywh.y + 'px'
        p.style.left = p.xywh.x + 'px'
        if (p.dirx !== 0) p.setAttribute('dir', p.dirx < 0 ? 'left' : 'right')
        p.setAttribute('action', p.action)
    }

    // world

    world.start = () => {
        let last = new Date().getTime()
        const interval = setInterval(() => {
            try {
            let inst = new Date().getTime()
            world.player.render(inst - last)
            last = inst
        } catch (err) {
            console.error(err)
            clearInterval(interval)
        }
        }, FPS)
    }
    
    return world
}

